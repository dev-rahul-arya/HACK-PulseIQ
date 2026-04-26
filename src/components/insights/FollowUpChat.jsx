import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../db/db';
import { askFollowUp } from '../../services/ai';
import { getProfile } from '../../services/profile';

const SUGGESTIONS = [
  'What signal drove this most?',
  'How does this compare to last week?',
  'What could I try tonight?',
];

export function FollowUpChat({
  insightId,
  insightSummary,
  contextSummary,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Load any persisted conversation for this insight.
  useEffect(() => {
    let cancelled = false;
    if (!insightId) return;
    db.aiInsights.get(insightId).then((row) => {
      if (cancelled) return;
      const saved = row?.payload?.conversation ?? [];
      setHistory(saved);
      if (saved.length > 0) setOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, [insightId]);

  async function persist(next) {
    if (!insightId) return;
    const row = await db.aiInsights.get(insightId);
    if (!row) return;
    await db.aiInsights.update(insightId, {
      payload: { ...row.payload, conversation: next },
    });
  }

  async function send(question) {
    if (!question || busy) return;
    setError(null);
    setBusy(true);
    setDraft('');
    const optimistic = [...history, { user: question, assistant: '…' }];
    setHistory(optimistic);
    try {
      const profile = await getProfile().catch(() => null);
      const { answer } = await askFollowUp({
        insightSummary,
        contextSummary,
        history,
        question,
        focusGoals: profile?.goals ?? [],
      });
      const next = [...history, { user: question, assistant: answer }];
      setHistory(next);
      await persist(next);
    } catch (err) {
      setError(err.message === 'offline' ? "You're offline — try again when you're back." : 'Claude is unreachable right now.');
      setHistory(history); // roll back optimistic
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(draft.trim());
  }

  if (!insightId) return null;

  const headerSize = compact ? 'text-[10px]' : 'text-[11px]';

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      {!open ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="w-full text-left text-xs text-accent-mental hover:opacity-80 transition-opacity"
        >
          Ask a follow-up →
        </button>
      ) : (
        <>
          <p className={`${headerSize} uppercase tracking-widest text-textSecondary/60 mb-2`}>
            Ask a follow-up
          </p>
          <AnimatePresence initial={false}>
            {history.map((turn, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3"
              >
                <div className="text-xs text-textSecondary/60 mb-1">You</div>
                <p className="text-sm text-textPrimary mb-2">{turn.user}</p>
                <div className="text-xs text-accent-mental mb-1">Claude</div>
                <p className="text-sm text-textSecondary/85 leading-relaxed">
                  {turn.assistant === '…' ? (
                    <span className="inline-flex gap-1" aria-label="Claude is thinking">
                      <span className="w-1.5 h-1.5 rounded-full bg-textSecondary/60 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-textSecondary/60 animate-pulse [animation-delay:120ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-textSecondary/60 animate-pulse [animation-delay:240ms]" />
                    </span>
                  ) : (
                    turn.assistant
                  )}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>

          {history.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    send(s);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-elevated/60 border border-white/5 text-textSecondary/80 hover:text-textPrimary hover:border-white/15 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="flex gap-2">
            <label htmlFor={`followup-${insightId}`} className="sr-only">
              Ask Claude a follow-up question
            </label>
            <input
              id={`followup-${insightId}`}
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. What about my HRV?"
              disabled={busy}
              className="flex-1 bg-elevated/60 border border-white/5 rounded-xl px-3 py-2 text-sm outline-none focus:border-white/20 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="px-3 py-2 text-xs rounded-xl bg-white text-background font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? '…' : 'Ask'}
            </button>
          </form>
          {error && (
            <p className="text-[11px] text-danger mt-2" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
