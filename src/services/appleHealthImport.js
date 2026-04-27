// Apple Health import: reads export.zip (the file the Health app produces),
// streams export.xml through a SAX parser, and maps records to PulseIQ's
// healthMetrics schema.
//
// Mapping notes:
// - Steps: sum HKQuantityTypeIdentifierStepCount per local day.
// - Sleep: group SleepAnalysis intervals into nights, attribute to the
//   wake-up day. Total = sum of "Asleep*" intervals; fall back to "InBed"
//   if only InBed records exist.
// - Resting HR: derived per night as the 10th-percentile of HR samples
//   inside the sleep window (mirrors what watchOS does internally).
//   This is a proxy — Apple Health export typically does not include
//   HKQuantityTypeIdentifierRestingHeartRate.
// - HRV: HKQuantityTypeIdentifierHeartRateVariabilitySDNN if present.

import JSZip from 'jszip';
import sax from 'sax';
import { dayKey } from '../db/db';

const SLEEP_VALUES_ASLEEP = new Set([
  'HKCategoryValueSleepAnalysisAsleep',
  'HKCategoryValueSleepAnalysisAsleepCore',
  'HKCategoryValueSleepAnalysisAsleepDeep',
  'HKCategoryValueSleepAnalysisAsleepREM',
  'HKCategoryValueSleepAnalysisAsleepUnspecified',
]);
const SLEEP_VALUE_INBED = 'HKCategoryValueSleepAnalysisInBed';
const SLEEP_VALUE_DEEP = 'HKCategoryValueSleepAnalysisAsleepDeep';

// Group intervals that fall within this gap (ms) into the same "night".
const NIGHT_GAP_MS = 30 * 60 * 1000;
// Skip sleep nights shorter than this (likely naps logged as nights).
const MIN_NIGHT_MS = 90 * 60 * 1000;

// Apple format: "YYYY-MM-DD HH:MM:SS ±HHMM" (note the space, not T, and no
// colon in the offset). V8 parses this, Safari does not. Parse explicitly,
// fall back to native, return null if both fail.
const APPLE_DATE_RE =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?\s*([+-])(\d{2}):?(\d{2})$/;

function parseAppleDate(s) {
  if (!s) return null;
  const m = APPLE_DATE_RE.exec(s);
  if (m) {
    const [, y, mo, d, h, mi, se, , sign, oh, om] = m;
    const utcMs = Date.UTC(+y, +mo - 1, +d, +h, +mi, +se);
    const offsetMin = +oh * 60 + +om;
    const offsetMs = (sign === '+' ? -1 : 1) * offsetMin * 60_000;
    const date = new Date(utcMs + offsetMs);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  const fallback = new Date(s);
  return Number.isFinite(fallback.getTime()) ? fallback : null;
}

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function findExportXml(zip) {
  // Apple's archive is "apple_health_export/export.xml" but be tolerant.
  const candidates = Object.values(zip.files).filter(
    (f) => !f.dir && /export\.xml$/i.test(f.name) && !/cda/i.test(f.name)
  );
  if (!candidates.length) return null;
  // Prefer one whose path ends with apple_health_export/export.xml
  candidates.sort((a, b) => {
    const ascore = /apple_health_export\/export\.xml$/i.test(a.name) ? 0 : 1;
    const bscore = /apple_health_export\/export\.xml$/i.test(b.name) ? 0 : 1;
    return ascore - bscore;
  });
  return candidates[0];
}

export async function importAppleHealthZip(file, onProgress = () => {}) {
  onProgress({ phase: 'unzip', message: 'Opening export.zip…', percent: 0 });
  const zip = await JSZip.loadAsync(file);
  const xmlEntry = findExportXml(zip);
  if (!xmlEntry) {
    throw new Error(
      "Couldn't find export.xml inside the zip. Make sure you uploaded the file Apple Health produces."
    );
  }

  onProgress({ phase: 'unzip', message: 'Extracting export.xml…', percent: 5 });
  const text = await xmlEntry.async('string');
  const total = text.length;

  // Aggregators.
  const dailySteps = new Map(); // dayKey -> sum
  const hrPerDay = new Map(); // dayKey -> [{ts:number, value:number}]
  const hrvSamples = []; // {ts, value}
  const sleepIntervals = []; // {start: Date, end: Date, value: string}
  let recordsSeen = 0;

  const parser = sax.parser(true, { trim: false, normalize: false, lowercase: false });

  parser.onerror = () => {
    // Recover from minor errors — Apple sometimes emits unescaped chars.
    parser.error = null;
    parser.resume();
  };

  parser.onopentag = (node) => {
    if (node.name !== 'Record') return;
    recordsSeen++;
    const a = node.attributes;
    const type = a.type;
    if (!type) return;

    if (type === 'HKQuantityTypeIdentifierStepCount') {
      const v = Number(a.value);
      if (!isFiniteNumber(v) || v < 0) return;
      const d = parseAppleDate(a.startDate);
      if (!d) return;
      const dk = dayKey(d);
      dailySteps.set(dk, (dailySteps.get(dk) || 0) + v);
    } else if (type === 'HKQuantityTypeIdentifierHeartRate') {
      const v = Number(a.value);
      if (!isFiniteNumber(v) || v < 25 || v > 240) return;
      const d = parseAppleDate(a.startDate);
      if (!d) return;
      const dk = dayKey(d);
      let arr = hrPerDay.get(dk);
      if (!arr) {
        arr = [];
        hrPerDay.set(dk, arr);
      }
      arr.push({ ts: d.getTime(), value: v });
    } else if (type === 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN') {
      const v = Number(a.value);
      if (!isFiniteNumber(v) || v <= 0 || v > 500) return;
      const d = parseAppleDate(a.startDate);
      if (!d) return;
      hrvSamples.push({ ts: d.getTime(), value: v, dayKey: dayKey(d) });
    } else if (type === 'HKCategoryTypeIdentifierSleepAnalysis') {
      const start = parseAppleDate(a.startDate);
      const end = parseAppleDate(a.endDate);
      if (!start || !end || !(end > start)) return;
      sleepIntervals.push({ start, end, value: a.value });
    }
  };

  // Feed in chunks so the UI thread isn't blocked.
  const CHUNK = 256 * 1024;
  for (let i = 0; i < total; i += CHUNK) {
    parser.write(text.slice(i, i + CHUNK));
    const pct = 5 + Math.round((Math.min(i + CHUNK, total) / total) * 80);
    onProgress({
      phase: 'parse',
      message: `Parsing health records… ${recordsSeen.toLocaleString()} read`,
      percent: pct,
    });
    await new Promise((r) => setTimeout(r, 0));
  }
  parser.close();

  onProgress({ phase: 'aggregate', message: 'Rolling up daily summaries…', percent: 88 });

  // Roll up sleep intervals into nights (gap-based grouping).
  sleepIntervals.sort((a, b) => a.start - b.start);
  const nights = [];
  for (const iv of sleepIntervals) {
    const last = nights[nights.length - 1];
    if (last && iv.start - last.end <= NIGHT_GAP_MS) {
      if (iv.end > last.end) last.end = iv.end;
      last.intervals.push(iv);
    } else {
      nights.push({ start: iv.start, end: iv.end, intervals: [iv] });
    }
  }

  const sleepRecords = [];
  const restingHRRecords = [];
  for (const night of nights) {
    if (night.end - night.start < MIN_NIGHT_MS) continue;
    const wakeDate = new Date(night.end);
    const dk = dayKey(wakeDate);

    const asleepMs = night.intervals
      .filter((iv) => SLEEP_VALUES_ASLEEP.has(iv.value))
      .reduce((s, iv) => s + (iv.end - iv.start), 0);
    const inBedMs = night.intervals
      .filter((iv) => iv.value === SLEEP_VALUE_INBED)
      .reduce((s, iv) => s + (iv.end - iv.start), 0);
    const totalMs = asleepMs > 0 ? asleepMs : inBedMs;
    if (totalMs < MIN_NIGHT_MS) continue;

    const hours = totalMs / 3600000;
    const deepMs = night.intervals
      .filter((iv) => iv.value === SLEEP_VALUE_DEEP)
      .reduce((s, iv) => s + (iv.end - iv.start), 0);

    sleepRecords.push({
      type: 'sleep',
      value: Number(hours.toFixed(2)),
      timestamp: wakeDate.toISOString(),
      dayKey: dk,
      details: deepMs > 0 ? { deepHours: Number((deepMs / 3600000).toFixed(2)) } : {},
    });

    // Resting HR proxy: 10th-percentile HR within the sleep window.
    const winStart = night.start.getTime();
    const winEnd = night.end.getTime();
    const candidates = [];
    const dkPrev = dayKey(new Date(winStart));
    for (const candidateDk of new Set([dk, dkPrev])) {
      const arr = hrPerDay.get(candidateDk);
      if (!arr) continue;
      for (const s of arr) {
        if (s.ts >= winStart && s.ts <= winEnd) candidates.push(s.value);
      }
    }
    if (candidates.length >= 5) {
      candidates.sort((a, b) => a - b);
      const idx = Math.max(0, Math.floor(candidates.length * 0.1));
      restingHRRecords.push({
        type: 'restingHR',
        value: Math.round(candidates[idx]),
        timestamp: wakeDate.toISOString(),
        dayKey: dk,
        details: { samples: candidates.length, derived: 'percentile-10-overnight' },
      });
    }
  }

  // Steps → one record per day.
  const stepRecords = [];
  for (const [dk, sum] of dailySteps) {
    if (sum <= 0) continue;
    stepRecords.push({
      type: 'steps',
      value: Math.round(sum),
      timestamp: new Date(`${dk}T23:59:00`).toISOString(),
      dayKey: dk,
    });
  }

  // HRV → one record per day (median of samples).
  const hrvByDay = new Map();
  for (const s of hrvSamples) {
    let arr = hrvByDay.get(s.dayKey);
    if (!arr) {
      arr = [];
      hrvByDay.set(s.dayKey, arr);
    }
    arr.push(s.value);
  }
  const hrvRecords = [];
  for (const [dk, arr] of hrvByDay) {
    arr.sort((a, b) => a - b);
    const median = arr[Math.floor(arr.length / 2)];
    hrvRecords.push({
      type: 'hrv',
      value: Math.round(median),
      timestamp: new Date(`${dk}T08:00:00`).toISOString(),
      dayKey: dk,
    });
  }

  const records = [...sleepRecords, ...restingHRRecords, ...stepRecords, ...hrvRecords];
  records.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));

  // Date range across all derived records.
  let firstDay = null;
  let lastDay = null;
  for (const r of records) {
    if (!firstDay || r.dayKey < firstDay) firstDay = r.dayKey;
    if (!lastDay || r.dayKey > lastDay) lastDay = r.dayKey;
  }

  onProgress({ phase: 'aggregate', message: 'Done', percent: 95 });

  return {
    records,
    summary: {
      recordsRead: recordsSeen,
      sleepNights: sleepRecords.length,
      restingHRDays: restingHRRecords.length,
      stepDays: stepRecords.length,
      hrvDays: hrvRecords.length,
      missingHRV: hrvRecords.length === 0,
      firstDay,
      lastDay,
    },
  };
}

// Insert the records produced above into Dexie. Replaces existing data so
// the demo state is consistent. Yields between chunks to keep the UI alive.
export async function commitImportedRecords(records, db, onProgress = () => {}) {
  await db.healthMetrics.clear();
  const BATCH = 500;
  for (let i = 0; i < records.length; i += BATCH) {
    const slice = records.slice(i, i + BATCH);
    await db.healthMetrics.bulkAdd(slice);
    const pct = 95 + Math.round((Math.min(i + BATCH, records.length) / records.length) * 5);
    onProgress({ phase: 'write', message: `Saving ${i + slice.length}/${records.length}…`, percent: pct });
    await new Promise((r) => setTimeout(r, 0));
  }
  onProgress({ phase: 'done', message: 'Import complete', percent: 100 });
}
