import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { hasAnyData, seedSampleData } from '../../db/queries';
import { useStore } from '../../store/useStore';

const APPS = [
  { key: 'apple', name: 'Apple Health', color: '#FFFFFF' },
  { key: 'google', name: 'Google Health Connect', color: '#34A853' },
];

export function ConnectedApps() {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const setHasSyncedSampleData = useStore((s) => s.setHasSyncedSampleData);

  useEffect(() => {
    (async () => {
      const has = await hasAnyData();
      setConnected(has);
      setHasSyncedSampleData(has);
    })();
  }, [setHasSyncedSampleData]);

  async function handleConnect(appKey) {
    setSyncing(appKey);
    setShowInfo(true);
    // Brief animation pause so the demo "feels" like syncing.
    await new Promise((r) => setTimeout(r, 1200));
    await seedSampleData();
    setConnected(true);
    setHasSyncedSampleData(true);
    setSyncing(null);
  }

  return (
    <Card className="!p-5 mb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-textSecondary/60">
            Connected apps
          </p>
          <p className="text-sm text-textSecondary/70 mt-2">
            Pull your real health data from one place.
          </p>
        </div>
        {connected && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success">
            Synced
          </span>
        )}
      </div>
      <div className="mt-4 space-y-2">
        {APPS.map((app) => (
          <div
            key={app.key}
            className="flex items-center justify-between gap-3 bg-elevated/40 border border-white/5 rounded-xl px-3 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-background font-semibold"
                style={{ background: app.color }}
              >
                {app.key === 'apple' ? '' : 'G'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{app.name}</p>
                <p className="text-xs text-textSecondary/50">
                  {connected ? 'Sample data loaded' : 'Tap to load sample'}
                </p>
              </div>
            </div>
            <Button
              variant={connected ? 'ghost' : 'primary'}
              onClick={() => handleConnect(app.key)}
              disabled={!!syncing}
              className="!px-4 !py-2 text-xs"
            >
              {syncing === app.key
                ? 'Syncing…'
                : connected
                ? 'Re-sync'
                : 'Connect'}
            </Button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-textSecondary/50 mt-3 leading-relaxed"
          >
            Web apps can't talk to Apple Health or Health Connect directly. For
            this demo we load a realistic 30-day sample so you can see the AI
            analysis. The full app would sync from your wearable.
          </motion.p>
        )}
      </AnimatePresence>
    </Card>
  );
}
