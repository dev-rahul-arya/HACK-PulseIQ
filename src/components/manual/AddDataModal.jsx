import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { addManualLog } from '../../db/queries';

const CATEGORIES = [
  { key: 'mood', label: 'Mood' },
  { key: 'symptom', label: 'Symptom' },
  { key: 'bp', label: 'BP' },
  { key: 'weight', label: 'Weight' },
  { key: 'note', label: 'Note' },
];

const MOODS = [
  { value: 1, emoji: '😞', label: 'Low' },
  { value: 2, emoji: '😕', label: 'Down' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

const COMMON_SYMPTOMS = [
  'headache',
  'fatigue',
  'nausea',
  'cramps',
  'anxiety',
  'congestion',
  'sore throat',
];

export function AddDataModal() {
  const open = useStore((s) => s.addModalOpen);
  const close = useStore((s) => s.closeAddModal);
  const [category, setCategory] = useState('mood');

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-data-title"
            className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto bg-surface rounded-t-3xl border-t border-white/5 shadow-card max-h-[85vh] overflow-y-auto safe-bottom"
          >
            <div className="flex justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-white/15" aria-hidden="true" />
            </div>
            <div className="px-5 pt-4 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 id="add-data-title" className="text-xl font-semibold">Add data</h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close add data sheet"
                  className="text-textSecondary/60 hover:text-textPrimary p-2 rounded-full hover:bg-white/5"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div role="tablist" aria-label="Data categories" className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-3 mb-4">
                {CATEGORIES.map((c) => {
                  const active = category === c.key;
                  return (
                    <motion.button
                      key={c.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCategory(c.key)}
                      className={
                        'shrink-0 px-4 py-2 rounded-full text-sm border transition-colors ' +
                        (active
                          ? 'bg-white text-background border-white'
                          : 'bg-elevated/50 text-textPrimary border-white/10')
                      }
                    >
                      {c.label}
                    </motion.button>
                  );
                })}
              </div>

              <CategoryForm category={category} onSaved={close} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CategoryForm({ category, onSaved }) {
  if (category === 'mood') return <MoodForm onSaved={onSaved} />;
  if (category === 'symptom') return <SymptomForm onSaved={onSaved} />;
  if (category === 'bp') return <BPForm onSaved={onSaved} />;
  if (category === 'weight') return <WeightForm onSaved={onSaved} />;
  if (category === 'note') return <NoteForm onSaved={onSaved} />;
  return null;
}

function MoodForm({ onSaved }) {
  const [value, setValue] = useState(null);
  const [note, setNote] = useState('');
  return (
    <div>
      <p className="text-sm text-textSecondary/70 mb-3">How are you feeling?</p>
      <div className="grid grid-cols-5 gap-2 mb-4">
        {MOODS.map((m) => (
          <motion.button
            key={m.value}
            whileTap={{ scale: 0.92 }}
            onClick={() => setValue(m.value)}
            className={
              'flex flex-col items-center justify-center py-3 rounded-2xl border transition-colors ' +
              (value === m.value
                ? 'bg-white/10 border-white/30'
                : 'bg-elevated/40 border-white/5')
            }
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-[10px] mt-1 text-textSecondary/70">{m.label}</span>
          </motion.button>
        ))}
      </div>
      <Input
        as="textarea"
        placeholder="Anything to note? (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <SaveBar
        disabled={value == null}
        onSave={async () => {
          await addManualLog({ category: 'mood', value, details: { note } });
          onSaved();
        }}
      />
    </div>
  );
}

function SymptomForm({ onSaved }) {
  const [name, setName] = useState('');
  const [severity, setSeverity] = useState(2);
  const [note, setNote] = useState('');
  return (
    <div>
      <p className="text-sm text-textSecondary/70 mb-3">What symptom?</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {COMMON_SYMPTOMS.map((s) => (
          <motion.button
            key={s}
            whileTap={{ scale: 0.95 }}
            onClick={() => setName(s)}
            className={
              'px-3 py-1.5 rounded-full text-xs border ' +
              (name === s
                ? 'bg-white/10 border-white/30 text-textPrimary'
                : 'bg-elevated/40 border-white/5 text-textSecondary/70')
            }
          >
            {s}
          </motion.button>
        ))}
      </div>
      <Input
        placeholder="Or type your own"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-3"
      />
      <p className="text-xs text-textSecondary/60 mb-2">Severity</p>
      <div className="flex gap-2 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            whileTap={{ scale: 0.92 }}
            onClick={() => setSeverity(n)}
            className={
              'flex-1 py-2 rounded-xl border text-sm tabular-nums ' +
              (severity === n
                ? 'bg-white/10 border-white/30'
                : 'bg-elevated/40 border-white/5 text-textSecondary/70')
            }
          >
            {n}
          </motion.button>
        ))}
      </div>
      <Input
        as="textarea"
        placeholder="Notes (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <SaveBar
        disabled={!name.trim()}
        onSave={async () => {
          await addManualLog({
            category: 'symptom',
            value: name.trim(),
            details: { severity, note },
          });
          onSaved();
        }}
      />
    </div>
  );
}

function BPForm({ onSaved }) {
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  return (
    <div>
      <p className="text-sm text-textSecondary/70 mb-3">Blood pressure</p>
      <div className="flex items-center gap-3 mb-3">
        <Input
          inputMode="numeric"
          placeholder="Sys"
          value={sys}
          onChange={(e) => setSys(e.target.value)}
        />
        <span className="text-textSecondary/50 text-lg">/</span>
        <Input
          inputMode="numeric"
          placeholder="Dia"
          value={dia}
          onChange={(e) => setDia(e.target.value)}
        />
      </div>
      <SaveBar
        disabled={!sys || !dia}
        onSave={async () => {
          await addManualLog({
            category: 'bp',
            value: `${sys}/${dia}`,
            details: { systolic: Number(sys), diastolic: Number(dia) },
          });
          onSaved();
        }}
      />
    </div>
  );
}

function WeightForm({ onSaved }) {
  const [kg, setKg] = useState('');
  return (
    <div>
      <p className="text-sm text-textSecondary/70 mb-3">Weight (kg)</p>
      <Input
        inputMode="decimal"
        placeholder="e.g. 72.4"
        value={kg}
        onChange={(e) => setKg(e.target.value)}
      />
      <SaveBar
        disabled={!kg}
        onSave={async () => {
          await addManualLog({
            category: 'weight',
            value: Number(kg),
            details: { unit: 'kg' },
          });
          onSaved();
        }}
      />
    </div>
  );
}

function NoteForm({ onSaved }) {
  const [text, setText] = useState('');
  return (
    <div>
      <p className="text-sm text-textSecondary/70 mb-3">Free-form note</p>
      <Input
        as="textarea"
        placeholder="Anything you want to remember about today…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
      />
      <SaveBar
        disabled={!text.trim()}
        onSave={async () => {
          await addManualLog({ category: 'note', value: text.trim() });
          onSaved();
        }}
      />
    </div>
  );
}

function Input({ as = 'input', className = '', rows = 3, ...rest }) {
  const Cmp = as;
  return (
    <Cmp
      rows={as === 'textarea' ? rows : undefined}
      className={
        'w-full bg-elevated/60 border border-white/5 rounded-xl px-3 py-2.5 text-base placeholder:text-textSecondary/40 outline-none focus:border-white/20 transition-colors resize-none ' +
        className
      }
      {...rest}
    />
  );
}

function SaveBar({ disabled, onSave }) {
  const [saving, setSaving] = useState(false);
  return (
    <div className="mt-5 flex justify-end">
      <Button
        disabled={disabled || saving}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave();
          } finally {
            setSaving(false);
          }
        }}
        className={disabled ? 'opacity-40' : ''}
      >
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
