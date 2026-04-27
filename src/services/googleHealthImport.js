// Google Takeout (Fit) import. Google Health Connect itself doesn't have a
// user-facing export; the realistic source is Google Takeout's "Fit" archive.
//
// What we look for:
//   - Daily Activity Metrics/YYYY-MM-DD.csv  → steps + min HR per day
//   - All Sessions.csv                       → sleep sessions
//
// HRV is not part of standard Fit exports; we accept that and flag it in the
// summary so the UI can disclose it.

import JSZip from 'jszip';
import { dayKey } from '../db/db';

const DAILY_CSV_RE = /Daily Activity Metrics\/(\d{4}-\d{2}-\d{2})\.csv$/i;
const SESSIONS_CSV_RE = /All Sessions\.csv$/i;

const NIGHT_GAP_MS = 30 * 60 * 1000;
const MIN_NIGHT_MS = 90 * 60 * 1000;

export async function importGoogleTakeoutZip(file, onProgress = () => {}) {
  onProgress({ phase: 'unzip', message: 'Opening Takeout zip…', percent: 0 });
  const zip = await JSZip.loadAsync(file);

  const dailyFiles = [];
  let sessionsFile = null;
  for (const f of Object.values(zip.files)) {
    if (f.dir) continue;
    if (DAILY_CSV_RE.test(f.name)) dailyFiles.push(f);
    else if (SESSIONS_CSV_RE.test(f.name)) sessionsFile = f;
  }

  if (dailyFiles.length === 0 && !sessionsFile) {
    throw new Error(
      "Couldn't find Google Fit data. Make sure you selected 'Fit' in Google Takeout — the zip should contain a Fit/ folder with 'Daily Activity Metrics' and/or 'All Sessions.csv'."
    );
  }

  const stepRecords = [];
  const restingHRRecords = [];
  const sleepRecords = [];

  // Daily CSVs.
  for (let i = 0; i < dailyFiles.length; i++) {
    const f = dailyFiles[i];
    const m = f.name.match(DAILY_CSV_RE);
    if (!m) continue;
    const dk = m[1];
    const text = await f.async('string');
    const { totalSteps, minHR } = parseDailyCsv(text);
    if (totalSteps > 0) {
      stepRecords.push({
        type: 'steps',
        value: Math.round(totalSteps),
        timestamp: new Date(`${dk}T23:59:00`).toISOString(),
        dayKey: dk,
      });
    }
    if (minHR != null) {
      restingHRRecords.push({
        type: 'restingHR',
        value: Math.round(minHR),
        timestamp: new Date(`${dk}T08:00:00`).toISOString(),
        dayKey: dk,
        details: { derived: 'min-hr-day' },
      });
    }
    if (i % 30 === 0) {
      const pct = 5 + Math.round((i / Math.max(1, dailyFiles.length)) * 70);
      onProgress({
        phase: 'parse',
        message: `Parsing daily metrics ${i + 1}/${dailyFiles.length}…`,
        percent: pct,
      });
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  // Sessions for sleep.
  if (sessionsFile) {
    onProgress({ phase: 'parse', message: 'Parsing sessions…', percent: 80 });
    const text = await sessionsFile.async('string');
    const nights = parseSessionsForSleep(text);
    for (const n of nights) {
      sleepRecords.push({
        type: 'sleep',
        value: Number(n.hours.toFixed(2)),
        timestamp: n.wakeIso,
        dayKey: n.dayKey,
        details: {},
      });
    }
  }

  const records = [...sleepRecords, ...restingHRRecords, ...stepRecords];
  records.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));

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
      recordsRead: dailyFiles.length + (sessionsFile ? 1 : 0),
      sleepNights: sleepRecords.length,
      restingHRDays: restingHRRecords.length,
      stepDays: stepRecords.length,
      hrvDays: 0,
      missingHRV: true,
      firstDay,
      lastDay,
    },
  };
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuote = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuote = true;
      else if (c === ',') {
        out.push(cur);
        cur = '';
      } else cur += c;
    }
  }
  out.push(cur);
  return out;
}

function parseDailyCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return { totalSteps: 0, minHR: null };
  const headers = parseCsvLine(lines[0]);
  const stepCol = headers.findIndex((h) => /step\s*count/i.test(h));
  const minHRCol = headers.findIndex((h) => /min\s*heart\s*rate/i.test(h));

  let totalSteps = 0;
  let minHR = Infinity;
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (stepCol >= 0) {
      const v = parseFloat(cells[stepCol]);
      if (Number.isFinite(v) && v > 0) totalSteps += v;
    }
    if (minHRCol >= 0) {
      const v = parseFloat(cells[minHRCol]);
      if (Number.isFinite(v) && v > 30 && v < 200 && v < minHR) minHR = v;
    }
  }
  return {
    totalSteps,
    minHR: Number.isFinite(minHR) ? minHR : null,
  };
}

function isSleepActivity(s) {
  if (!s) return false;
  const t = String(s).toLowerCase().trim();
  if (t === 'sleep' || t === 'sleeping') return true;
  if (t.includes('sleep')) return true;
  // Numeric Fit activity codes.
  if (['72', '109', '110', '111', '112'].includes(t)) return true;
  return false;
}

function parseSessionsForSleep(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  const startCol = headers.findIndex((h) => /start\s*time/i.test(h));
  const endCol = headers.findIndex((h) => /end\s*time/i.test(h));
  const typeCol = headers.findIndex((h) => /activity\s*(type|name)/i.test(h));
  if (startCol < 0 || endCol < 0 || typeCol < 0) return [];

  const intervals = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (!isSleepActivity(cells[typeCol])) continue;
    const start = new Date(cells[startCol]);
    const end = new Date(cells[endCol]);
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      !(end > start)
    )
      continue;
    intervals.push({ start, end });
  }

  intervals.sort((a, b) => a.start - b.start);
  const nights = [];
  for (const iv of intervals) {
    const last = nights[nights.length - 1];
    if (last && iv.start - last.end <= NIGHT_GAP_MS) {
      if (iv.end > last.end) last.end = iv.end;
      last.intervals.push(iv);
    } else {
      nights.push({ start: iv.start, end: iv.end, intervals: [iv] });
    }
  }

  const out = [];
  for (const n of nights) {
    const dur = n.end - n.start;
    if (dur < MIN_NIGHT_MS) continue;
    out.push({
      hours: dur / 3600000,
      wakeIso: n.end.toISOString(),
      dayKey: dayKey(n.end),
    });
  }
  return out;
}
