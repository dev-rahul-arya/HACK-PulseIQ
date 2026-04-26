import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { buildDoctorReport, openReport, downloadReport } from '../../services/report';
import { getProfile } from '../../services/profile';

const RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const SECTION_OPTIONS = [
  { key: 'vitals', label: 'Vitals trends' },
  { key: 'insights', label: 'AI insights' },
  { key: 'logs', label: 'Manual logs & symptoms' },
];

export function DoctorReportCard() {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(30);
  const [sections, setSections] = useState({ vitals: true, insights: true, logs: true });
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy]);

  const toggleSection = (k) => setSections((s) => ({ ...s, [k]: !s[k] }));

  async function generate(action) {
    setBusy(true);
    setLastError(null);
    try {
      const profile = await getProfile().catch(() => null);
      const html = await buildDoctorReport({ profile, days, sections });
      const filename = `pulseiq-report-${new Date().toISOString().slice(0, 10)}.html`;
      if (action === 'open') {
        const opened = openReport(html);
        if (!opened) downloadReport(html, filename);
      } else {
        downloadReport(html, filename);
      }
      setOpen(false);
    } catch (err) {
      setLastError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  const sectionCount = Object.values(sections).filter(Boolean).length;
  const canGenerate = sectionCount > 0 && !busy;

  return (
    <>
      <Card className="!p-5 mt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-textSecondary/60">
              Share with your doctor
            </p>
            <p className="text-sm text-textSecondary/80 mt-2 leading-relaxed">
              Generate a one-page summary of your trends, insights, and logs. Opens in a new tab —
              save as PDF from your browser, or download as HTML.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={() => setOpen(true)}>Create report</Button>
        </div>
      </Card>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !busy && setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-modal-title"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto bg-surface rounded-t-3xl border-t border-white/5 shadow-card safe-bottom"
            >
              <div className="flex justify-center pt-3">
                <div className="h-1 w-10 rounded-full bg-white/15" />
              </div>
              <div className="px-5 pt-4 pb-6">
                <h2 id="report-modal-title" className="text-xl font-semibold mb-1">
                  Doctor report
                </h2>
                <p className="text-sm text-textSecondary/70 mb-5">
                  A printable summary built from your local data. Nothing is uploaded.
                </p>

                <p className="text-xs text-textSecondary/60 mb-2">Date range</p>
                <div className="flex gap-2 mb-5">
                  {RANGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDays(opt.value)}
                      aria-pressed={days === opt.value}
                      className={`flex-1 text-sm py-2 rounded-xl border transition-colors ${
                        days === opt.value
                          ? 'bg-accent-mental/20 border-accent-mental/40 text-textPrimary'
                          : 'bg-elevated/60 border-white/5 text-textSecondary/80 hover:text-textPrimary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-textSecondary/60 mb-2">Include</p>
                <div className="flex flex-col gap-2 mb-5">
                  {SECTION_OPTIONS.map((s) => {
                    const active = !!sections[s.key];
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => toggleSection(s.key)}
                        aria-pressed={active}
                        className={`flex items-center justify-between text-sm px-4 py-3 rounded-xl border transition-colors ${
                          active
                            ? 'bg-accent-mental/15 border-accent-mental/40 text-textPrimary'
                            : 'bg-elevated/60 border-white/5 text-textSecondary/80'
                        }`}
                      >
                        <span>{s.label}</span>
                        <span
                          aria-hidden="true"
                          className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs ${
                            active ? 'bg-accent-mental border-accent-mental text-background' : 'border-white/20'
                          }`}
                        >
                          {active ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {lastError && (
                  <p className="text-xs text-danger mb-3" role="alert">
                    {lastError}
                  </p>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => !busy && setOpen(false)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => generate('download')}
                    disabled={!canGenerate}
                  >
                    Download
                  </Button>
                  <Button onClick={() => generate('open')} disabled={!canGenerate}>
                    {busy ? 'Generating…' : 'Open report'}
                  </Button>
                </div>
                <p className="text-[10px] text-textSecondary/40 mt-4">
                  Tip: in the new tab, use your browser's <strong>Print → Save as PDF</strong> to send a clean copy.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
