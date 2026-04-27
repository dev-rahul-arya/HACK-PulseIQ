import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HELPLINES, KIND_LABEL, KIND_COLOR } from '../../data/helplines';

export function HelplineSheet({ open, onClose, leadingMessage }) {
  const [tab, setTab] = useState('helplines');

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Reset to helplines view whenever the sheet is reopened.
  useEffect(() => {
    if (open) setTab('helplines');
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="helpline-sheet-title"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="w-full max-w-lg bg-surface rounded-t-3xl border-t border-white/5 max-h-[88vh] overflow-y-auto pb-8 safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-white/15" />
            </div>
            <div className="px-5 pt-4">
              <h2
                id="helpline-sheet-title"
                className="text-xl font-semibold leading-tight"
              >
                Get help
              </h2>
              <p className="text-sm text-textSecondary/70 mt-1.5 leading-relaxed">
                {leadingMessage ||
                  'PulseIQ is not a clinical tool. If anything feels off, talk to a human.'}
              </p>

              <div
                role="tablist"
                aria-label="Get help options"
                className="mt-4 grid grid-cols-2 gap-1 p-1 rounded-xl bg-elevated/40 border border-white/5"
              >
                <TabButton
                  active={tab === 'helplines'}
                  onClick={() => setTab('helplines')}
                  label="Helplines"
                />
                <TabButton
                  active={tab === 'nearby'}
                  onClick={() => setTab('nearby')}
                  label="Nearby hospitals"
                />
              </div>

              {tab === 'helplines' ? <HelplinesList /> : <NearbyHospitals />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        'text-xs font-medium py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none ' +
        (active
          ? 'bg-white text-background'
          : 'text-textSecondary/70 hover:text-textPrimary')
      }
    >
      {label}
    </button>
  );
}

function HelplinesList() {
  return (
    <>
      <ul className="mt-4 space-y-2">
        {HELPLINES.map((h) => (
          <li
            key={h.id}
            className="bg-elevated/40 border border-white/5 rounded-xl p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] uppercase tracking-widest font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      color: KIND_COLOR[h.kind],
                      background: `${KIND_COLOR[h.kind]}1A`,
                    }}
                  >
                    {KIND_LABEL[h.kind]}
                  </span>
                  <span className="text-[10px] text-textSecondary/50">
                    {h.hours}
                  </span>
                </div>
                <p className="text-sm font-medium truncate">{h.name}</p>
                <p className="text-[11px] text-textSecondary/60 mt-0.5 leading-relaxed">
                  {h.note}
                </p>
              </div>
              <a
                href={`tel:${h.tel}`}
                className="shrink-0 px-3 py-2 rounded-xl bg-white text-background text-sm font-medium tabular-nums focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none"
                aria-label={`Call ${h.name} at ${h.number}`}
              >
                {h.number}
              </a>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-[10px] text-textSecondary/40 mt-5 leading-relaxed">
        Numbers are India-region. If you're outside India, dial your local
        emergency number — most countries also have a national mental-health
        line listed at iasp.info/resources/Crisis_Centres.
      </p>
    </>
  );
}

function NearbyHospitals() {
  const [status, setStatus] = useState('idle'); // idle | locating | located | denied | unsupported
  const [coords, setCoords] = useState(null);

  function locate() {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('located');
      },
      () => {
        setStatus('denied');
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  }

  function mapsUrl() {
    if (coords) {
      // Centered on user's current coords with hospital query.
      return `https://www.google.com/maps/search/hospital/@${coords.lat},${coords.lng},14z`;
    }
    return 'https://www.google.com/maps/search/?api=1&query=hospital+near+me';
  }

  return (
    <div className="mt-4">
      <div className="bg-elevated/40 border border-white/5 rounded-xl p-4">
        <p className="text-sm font-medium">Find a hospital near you</p>
        <p className="text-[12px] text-textSecondary/70 mt-1.5 leading-relaxed">
          Opens your maps app with a search for hospitals. We don't store or
          send your location anywhere — geolocation, if granted, is used only
          to center the map.
        </p>

        {status === 'idle' && (
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={locate}
              className="w-full py-2.5 rounded-xl bg-white text-background text-sm font-medium focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none"
            >
              Use my location
            </button>
            <a
              href={mapsUrl()}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-elevated/60 border border-white/5 text-textPrimary text-sm font-medium text-center focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none"
            >
              Open Maps without location
            </a>
          </div>
        )}

        {status === 'locating' && (
          <p className="text-[12px] text-textSecondary/60 mt-4">
            Getting your location…
          </p>
        )}

        {status === 'located' && (
          <div className="mt-4">
            <p className="text-[11px] text-textSecondary/60 mb-2 tabular-nums">
              Located: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
            </p>
            <a
              href={mapsUrl()}
              target="_blank"
              rel="noreferrer"
              className="block w-full py-2.5 rounded-xl bg-white text-background text-sm font-medium text-center focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none"
            >
              Open Maps · hospitals near me
            </a>
          </div>
        )}

        {(status === 'denied' || status === 'unsupported') && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[11px] text-accent-heart">
              {status === 'denied'
                ? 'Location permission denied — opening a generic search instead.'
                : "Geolocation isn't available on this device."}
            </p>
            <a
              href={mapsUrl()}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-white text-background text-sm font-medium text-center focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none"
            >
              Open Maps · hospital near me
            </a>
          </div>
        )}
      </div>

      <div className="bg-accent-heart/10 border border-accent-heart/30 rounded-xl p-3 mt-3">
        <p className="text-[11px] text-accent-heart font-medium">
          In an emergency
        </p>
        <p className="text-[11px] text-textSecondary/80 mt-1 leading-relaxed">
          If you or someone near you needs immediate help, call your local
          emergency number now (India: <a href="tel:112" className="underline">112</a>,
          medical: <a href="tel:102" className="underline">102</a>). Don't wait
          for the map to load.
        </p>
      </div>
    </div>
  );
}
