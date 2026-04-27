import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { hasAnyData, seedSampleData } from '../../db/queries';
import { useStore } from '../../store/useStore';
import { db } from '../../db/db';
import {
  importAppleHealthZip,
  commitImportedRecords,
} from '../../services/appleHealthImport';
import { importGoogleTakeoutZip } from '../../services/googleHealthImport';

export function ConnectedApps() {
  const [connected, setConnected] = useState(false);
  const setHasSyncedSampleData = useStore((s) => s.setHasSyncedSampleData);

  useEffect(() => {
    (async () => {
      const has = await hasAnyData();
      setConnected(has);
      setHasSyncedSampleData(has);
    })();
  }, [setHasSyncedSampleData]);

  function markConnected() {
    setConnected(true);
    setHasSyncedSampleData(true);
  }

  return (
    <Card className="!p-5 mb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-textSecondary/60">
            Data sources
          </p>
          <p className="text-sm text-textSecondary/70 mt-2">
            Pull your real health data from a wearable export, or load a sample
            dataset to try the app.
          </p>
        </div>
        {connected && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success">
            Loaded
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <UploadRow
          appKey="apple"
          name="Apple Health"
          accent="#FFFFFF"
          accentLetter=""
          hint={
            <>
              In <em>Health</em> → <em>Profile</em> → <em>Export All Health Data</em>. Upload the resulting{' '}
              <code className="text-textSecondary/70">export.zip</code>.
            </>
          }
          missingNote="HRV records aren't in standard Apple exports — risk score will skip the HRV contributor for those days. Resting HR is derived from the 10th-percentile of overnight heart-rate samples."
          importer={importAppleHealthZip}
          onSuccess={markConnected}
        />

        <UploadRow
          appKey="google"
          name="Google Health Connect"
          accent="#34A853"
          accentLetter="G"
          hint={
            <>
              In <a href="https://takeout.google.com" target="_blank" rel="noreferrer" className="text-accent-mental">Google Takeout</a> select <em>Fit</em> only and upload the resulting zip.
            </>
          }
          missingNote="Google Fit exports don't include HRV. Resting HR is derived from each day's minimum heart rate."
          importer={importGoogleTakeoutZip}
          onSuccess={markConnected}
        />

        <SampleRow connected={connected} onSuccess={markConnected} />
      </div>

      <p className="text-[10px] text-textSecondary/40 mt-4 leading-relaxed">
        Imported data stays on this device — IndexedDB only, no upload. Switch
        sources any time to overwrite the previous import.
      </p>
    </Card>
  );
}

function UploadRow({ appKey, name, accent, accentLetter, hint, missingNote, importer, onSuccess }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const inputRef = useRef(null);

  function pick() {
    setError(null);
    setResult(null);
    inputRef.current?.click();
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress({ percent: 0, message: 'Starting…' });
    try {
      const { records, summary } = await importer(file, (p) => {
        setProgress({ percent: p.percent ?? 0, message: p.message || '' });
      });
      if (!records.length) {
        throw new Error("No usable records found in the upload.");
      }
      await commitImportedRecords(records, db, (p) => {
        setProgress({ percent: p.percent ?? 0, message: p.message || '' });
      });
      setResult(summary);
      onSuccess?.();
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="bg-elevated/40 border border-white/5 rounded-xl px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-background font-semibold"
            style={{ background: accent }}
          >
            {accentLetter}
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <p className="text-sm font-medium truncate">{name}</p>
            <InfoToggle open={showInfo} onToggle={() => setShowInfo((v) => !v)} />
          </div>
        </div>
        <Button
          variant="primary"
          onClick={pick}
          disabled={busy}
          className="!px-4 !py-2 text-xs whitespace-nowrap"
        >
          {busy ? 'Importing…' : 'Upload zip'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={onFile}
          className="hidden"
          aria-label={`Upload ${name} zip`}
        />
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.p
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="text-[11px] text-textSecondary/60 leading-relaxed overflow-hidden"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {progress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full bg-accent-mental rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percent}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] text-textSecondary/60 mt-1.5 tabular-nums">
              {progress.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" className="text-[11px] text-danger mt-2 leading-relaxed">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-3 text-[11px] text-textSecondary/70 leading-relaxed">
          <p className="text-success font-medium">Import complete.</p>
          <p className="mt-1">
            {result.sleepNights} sleep nights · {result.restingHRDays} resting-HR days ·{' '}
            {result.stepDays} step days
            {result.hrvDays > 0 ? ` · ${result.hrvDays} HRV days` : ''}
          </p>
          {result.firstDay && (
            <p className="text-textSecondary/50 mt-0.5">
              Range: {result.firstDay} → {result.lastDay}
            </p>
          )}
          {result.missingHRV && (
            <p className="text-textSecondary/50 mt-1.5">{missingNote}</p>
          )}
        </div>
      )}
    </div>
  );
}

function SampleRow({ connected, onSuccess }) {
  const [busy, setBusy] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  async function load() {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    await seedSampleData();
    onSuccess?.();
    setBusy(false);
  }

  return (
    <div className="bg-elevated/40 border border-dashed border-white/10 rounded-xl px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-mental/20 border border-accent-mental/40 text-accent-mental font-semibold">
            ★
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <p className="text-sm font-medium truncate">PulseIQ sample dataset</p>
            <InfoToggle open={showInfo} onToggle={() => setShowInfo((v) => !v)} />
          </div>
        </div>
        <Button
          variant={connected ? 'ghost' : 'primary'}
          onClick={load}
          disabled={busy}
          className="!px-4 !py-2 text-xs whitespace-nowrap"
        >
          {busy ? 'Loading…' : connected ? 'Reload' : 'Load sample'}
        </Button>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.p
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="text-[11px] text-textSecondary/60 leading-relaxed overflow-hidden"
          >
            30-day synthetic dataset with a deliberate rough-night stretch so the
            AI insights have something to find. Useful for trying the app.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoToggle({ open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? 'Hide details' : 'Show details'}
      className={
        'shrink-0 w-5 h-5 rounded-full border text-[10px] font-semibold flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none ' +
        (open
          ? 'bg-accent-mental/20 border-accent-mental/40 text-accent-mental'
          : 'border-white/15 text-textSecondary/60 hover:text-textPrimary hover:border-white/30')
      }
    >
      i
    </button>
  );
}
