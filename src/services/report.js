import { db } from '../db/db';
import { dailySeries } from '../db/queries';
import { buildWeeklyReport } from '../utils/weeklyReport';

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stats(values) {
  const xs = values.filter((v) => v != null && !Number.isNaN(v));
  if (!xs.length) return null;
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
  return { min, max, avg, n: xs.length };
}

function fmtRange(s, suffix = '') {
  if (!s) return '<em>no data</em>';
  return `avg ${s.avg.toFixed(1)}${suffix} · min ${s.min}${suffix} · max ${s.max}${suffix} · n=${s.n}`;
}

function sparklineSvg(values, color = '#5E5CE6') {
  if (!values || values.length < 2) return '';
  const w = 320;
  const h = 60;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const dx = (w - pad * 2) / (values.length - 1);
  const points = values
    .map((v, i) => `${(pad + i * dx).toFixed(1)},${(h - pad - ((v - min) / range) * (h - pad * 2)).toFixed(1)}`)
    .join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" aria-hidden="true">
    <polyline fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
  </svg>`;
}

function fmtDelta(delta, unit, opts = {}) {
  if (delta == null || !Number.isFinite(delta)) return '<span class="muted">no prior-week data</span>';
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '·';
  const goodDir = opts.higherIsBetter
    ? delta > 0
    : opts.higherIsBetter === false
    ? delta < 0
    : null;
  const color = goodDir === true ? '#1b5e20' : goodDir === false ? '#b71c1c' : '#666';
  const abs = opts.percent
    ? Math.round(Math.abs(delta))
    : Number(Math.abs(delta).toFixed(opts.decimals ?? 1));
  const suffix = opts.percent ? '%' : unit ? ` ${unit}` : '';
  return `<span style="color:${color}">${arrow} ${abs}${suffix}</span>`;
}

function barChartSvg(values, target, color) {
  if (!values || values.length === 0) return '';
  const w = 320;
  const h = 60;
  const pad = 4;
  const max = Math.max(...values, target ?? 0) * 1.05 || 1;
  const barW = (w - pad * 2) / values.length - 4;
  const targetY = target != null ? h - pad - (target / max) * (h - pad * 2) : null;
  const bars = values
    .map((v, i) => {
      const bh = max > 0 ? Math.max(2, (v / max) * (h - pad * 2)) : 0;
      const x = pad + i * (barW + 4);
      const y = h - pad - bh;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" fill="${color}" opacity="${v ? 0.85 : 0.2}" rx="2" />`;
    })
    .join('');
  const targetLine =
    targetY != null
      ? `<line x1="${pad}" x2="${w - pad}" y1="${targetY.toFixed(1)}" y2="${targetY.toFixed(1)}" stroke="#999" stroke-width="1" stroke-dasharray="3 3" />`
      : '';
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" aria-hidden="true">${targetLine}${bars}</svg>`;
}

function renderWeeklyBlock(weekly) {
  if (!weekly || weekly.empty) {
    return `<section>
      <h2>Weekly health report</h2>
      <p class="muted">Not enough recent data for a 7-day comparison.</p>
    </section>`;
  }
  const s = weekly.stats;
  const sleepVal = s.sleep.value != null ? `${s.sleep.value.toFixed(1)} h` : '—';
  const hrVal = s.restingHR.value != null ? `${Math.round(s.restingHR.value)} bpm` : '—';
  const hrvVal = s.hrv.value != null ? `${Math.round(s.hrv.value)} ms` : '—';
  const stepsVal = s.steps.total ? s.steps.total.toLocaleString() : '—';

  const highlightsHtml = weekly.highlights.length
    ? `<ul class="highlights">${weekly.highlights
        .map((h) => `<li><span class="dot" style="background:${h.color}"></span>${escapeHtml(h.text)}</li>`)
        .join('')}</ul>`
    : '<p class="muted">No notable shifts this week.</p>';

  return `<section>
    <h2>Weekly health report <span class="meta">· ${escapeHtml(weekly.range)}</span></h2>
    <p class="muted" style="margin-top:-4px">Last 7 days vs. the 7 before that.</p>
    <table class="stat-grid">
      <thead>
        <tr><th>Signal</th><th>This week</th><th>Δ vs. prior week</th></tr>
      </thead>
      <tbody>
        <tr><th scope="row">Avg sleep</th><td>${sleepVal}</td><td>${fmtDelta(s.sleep.delta, 'h', { higherIsBetter: true })}</td></tr>
        <tr><th scope="row">Avg resting HR</th><td>${hrVal}</td><td>${fmtDelta(s.restingHR.delta, 'bpm', { higherIsBetter: false, decimals: 0 })}</td></tr>
        <tr><th scope="row">Avg HRV</th><td>${hrvVal}</td><td>${fmtDelta(s.hrv.delta, 'ms', { higherIsBetter: true, decimals: 0 })}</td></tr>
        <tr><th scope="row">Total steps</th><td>${stepsVal}</td><td>${fmtDelta(s.steps.delta, '', { higherIsBetter: true, percent: true })}</td></tr>
      </tbody>
    </table>
    <div class="charts">
      <div class="chart">
        <h3>Sleep this week (target 7.5h)</h3>
        ${barChartSvg(weekly.charts.sleep, 7.5, '#5E5CE6')}
      </div>
      <div class="chart">
        <h3>Steps this week (target 8k)</h3>
        ${barChartSvg(weekly.charts.steps, 8000, '#FF9F0A')}
      </div>
    </div>
    <h3 class="hl-title">Highlights</h3>
    ${highlightsHtml}
  </section>`;
}

function tableRow(label, valueHtml, sparkHtml) {
  return `<tr>
    <th scope="row">${escapeHtml(label)}</th>
    <td>${valueHtml}</td>
    <td class="spark">${sparkHtml || ''}</td>
  </tr>`;
}

export async function buildDoctorReport({ profile, days = 30, sections }) {
  const include = {
    vitals: sections?.vitals !== false,
    weeklyReport: sections?.weeklyReport !== false,
    insights: sections?.insights !== false,
    logs: sections?.logs !== false,
  };

  const [sleep, restingHR, hrv, steps] = await Promise.all([
    dailySeries('sleep', days),
    dailySeries('restingHR', days),
    dailySeries('hrv', days),
    dailySeries('steps', days),
  ]);

  const sinceCutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const aiInsights = include.insights
    ? (await db.aiInsights.orderBy('id').reverse().toArray()).filter(
        (r) => (r.createdAt || '') >= sinceCutoff
      )
    : [];
  const manualLogs = include.logs
    ? (await db.manualLogs.orderBy('timestamp').reverse().toArray()).filter(
        (r) => r.timestamp >= sinceCutoff
      )
    : [];

  const sleepStats = stats(sleep.map((r) => r.value));
  const hrStats = stats(restingHR.map((r) => r.value));
  const hrvStats = stats(hrv.map((r) => r.value));
  const stepsStats = stats(steps.map((r) => r.value));

  const generatedAt = new Date().toLocaleString();
  const rangeLabel = `${new Date(Date.now() - days * 86400000).toLocaleDateString()} – ${new Date().toLocaleDateString()}`;

  let weeklyBlock = '';
  if (include.weeklyReport) {
    const [w14sleep, w14hr, w14hrv, w14steps] = days >= 14
      ? [sleep, restingHR, hrv, steps]
      : await Promise.all([
          dailySeries('sleep', 14),
          dailySeries('restingHR', 14),
          dailySeries('hrv', 14),
          dailySeries('steps', 14),
        ]);
    const weekly = buildWeeklyReport({
      sleep: w14sleep,
      hr: w14hr,
      hrv: w14hrv,
      steps: w14steps,
    });
    weeklyBlock = renderWeeklyBlock(weekly);
  }

  const vitalsBlock = include.vitals
    ? `<section>
        <h2>Vitals trend (${escapeHtml(rangeLabel)})</h2>
        <table>
          <thead>
            <tr><th scope="col">Signal</th><th scope="col">Range</th><th scope="col">Trend</th></tr>
          </thead>
          <tbody>
            ${tableRow('Sleep (h)', fmtRange(sleepStats, ' h'), sparklineSvg(sleep.map((r) => r.value), '#5E5CE6'))}
            ${tableRow('Resting HR (bpm)', fmtRange(hrStats, ' bpm'), sparklineSvg(restingHR.map((r) => r.value), '#FF375F'))}
            ${tableRow('HRV (ms)', fmtRange(hrvStats, ' ms'), sparklineSvg(hrv.map((r) => r.value), '#64D2FF'))}
            ${tableRow('Steps', fmtRange(stepsStats), sparklineSvg(steps.map((r) => r.value), '#FF9F0A'))}
          </tbody>
        </table>
      </section>`
    : '';

  const insightsBlock = include.insights
    ? `<section>
        <h2>AI insights (${aiInsights.length})</h2>
        ${
          aiInsights.length === 0
            ? '<p class="muted">No insights generated in this window.</p>'
            : aiInsights
                .map(
                  (r) => `<article class="insight">
                    <header>
                      <span class="kind">${escapeHtml(r.kind)}</span>
                      <span class="when">${escapeHtml(new Date(r.createdAt).toLocaleString())}</span>
                    </header>
                    <p>${escapeHtml(r.payload?.insight || r.payload?.keyTakeaway || '')}</p>
                    ${r.payload?.story ? `<p class="story">${escapeHtml(r.payload.story).replace(/\n\n/g, '</p><p class="story">')}</p>` : ''}
                    ${r.payload?.nudge ? `<p class="nudge"><strong>Nudge:</strong> ${escapeHtml(r.payload.nudge)}</p>` : ''}
                    ${r.payload?.feedback ? `<p class="muted">User feedback: ${r.payload.feedback.rating === 'up' ? '👍 helpful' : '👎 not helpful'}</p>` : ''}
                  </article>`
                )
                .join('')
        }
      </section>`
    : '';

  const logsBlock = include.logs
    ? `<section>
        <h2>Manual logs (${manualLogs.length})</h2>
        ${
          manualLogs.length === 0
            ? '<p class="muted">No manual logs in this window.</p>'
            : `<table><thead><tr><th>When</th><th>Category</th><th>Value</th><th>Notes</th></tr></thead><tbody>${manualLogs
                .map(
                  (l) => `<tr>
                    <td>${escapeHtml(new Date(l.timestamp).toLocaleString())}</td>
                    <td>${escapeHtml(l.category)}</td>
                    <td>${escapeHtml(typeof l.value === 'object' ? JSON.stringify(l.value) : l.value)}</td>
                    <td>${escapeHtml(l.details?.note || l.details?.severity ? `severity ${l.details.severity}` : '')}</td>
                  </tr>`
                )
                .join('')}</tbody></table>`
        }
      </section>`
    : '';

  const goalsHtml = profile?.goals?.length
    ? `<p><strong>Focus areas:</strong> ${profile.goals.map((g) => escapeHtml(g)).join(', ')}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>PulseIQ report — ${escapeHtml(profile?.displayName || 'You')}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font: 15px/1.5 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif; color: #111; background: #fff; margin: 0; padding: 32px; max-width: 820px; margin: 0 auto; }
  header.report-header { border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { font-size: 26px; margin: 0 0 4px; letter-spacing: -0.02em; }
  h2 { font-size: 18px; margin: 28px 0 10px; letter-spacing: -0.01em; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
  .meta { color: #666; font-size: 13px; }
  .disclaimer { background: #fff8e1; border: 1px solid #ffd54f; padding: 12px 14px; border-radius: 8px; font-size: 13px; color: #5d4037; margin: 16px 0 24px; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: middle; }
  th[scope="row"] { width: 32%; font-weight: 600; }
  td.spark { width: 36%; padding-right: 0; }
  td.spark svg { display: block; width: 100%; }
  .insight { border: 1px solid #eee; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
  .insight header { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 4px; }
  .insight .kind { text-transform: uppercase; letter-spacing: 0.06em; }
  .insight .nudge { color: #1b5e20; margin-top: 6px; }
  .story + .story { margin-top: 6px; }
  .muted { color: #888; font-size: 13px; }
  footer { margin-top: 36px; border-top: 1px solid #ddd; padding-top: 12px; color: #888; font-size: 12px; }
  table.stat-grid th { font-weight: 600; }
  table.stat-grid td:nth-child(2) { font-variant-numeric: tabular-nums; font-weight: 600; }
  table.stat-grid td:nth-child(3) { font-variant-numeric: tabular-nums; font-size: 13px; }
  .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 16px 0 8px; }
  .charts .chart h3 { font-size: 12px; color: #555; margin: 0 0 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
  .hl-title { font-size: 13px; color: #555; margin: 14px 0 6px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
  .highlights { list-style: none; padding: 0; margin: 0; }
  .highlights li { display: flex; gap: 8px; padding: 6px 0; font-size: 13px; line-height: 1.5; }
  .highlights .dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
  @media print { body { padding: 0; } .charts { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 540px) { .charts { grid-template-columns: 1fr; } }
</style>
</head>
<body>
  <header class="report-header">
    <h1>PulseIQ health report</h1>
    <p class="meta">Prepared for <strong>${escapeHtml(profile?.displayName || 'You')}</strong> · Range: ${escapeHtml(rangeLabel)} · Generated ${escapeHtml(generatedAt)}</p>
    ${goalsHtml}
  </header>
  <div class="disclaimer">
    <strong>Educational summary.</strong> PulseIQ is not a medical device and does not diagnose. The figures below come from the user's wearable, manual logs, and AI-generated explanations. Use as a discussion starting point with a clinician.
  </div>
  ${vitalsBlock}
  ${weeklyBlock}
  ${insightsBlock}
  ${logsBlock}
  <footer>
    Generated by PulseIQ on ${escapeHtml(generatedAt)}.
  </footer>
</body>
</html>`;
}

export function downloadReport(html, filename = 'pulseiq-report.html') {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openReport(html) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  // Browsers may block; the caller can fall back to download.
  return !!w;
}
