import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../db/db';
import { askFollowUp } from '../../services/ai';

const STARTERS = [
  'Why might my HRV be lower this week?',
  "What's the most useful thing I could do tonight?",
  'How does this compare to last week?',
];

// Persists the conversation on the aiInsights row's payload.conversation array.
// `insightId` is the Dexie id; `insightSummary` is the original observation
// text; `contextSummary` is a pre-formatted string of the data snapshot.
export function FollowUpChat({ insightId, insightSummary, contextSummary, focusGoals }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!insightId) {
        setLoaded(true);
        return;
      }
      const row = await db.aiInsights.get(insightId);
      if (cancelled) return;
      setHistory(row?.payload?.conversation || []);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [insightId]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history.length, busy]);

  async function send(question) {
    const q = String(question || '').trim();
    if (!q || busy || !insightId) return;
    setInput('');

    const userMsg = { role: 'user', content: q, ts: new Date().toISOString() };
    const next = [...history, userMsg];
    setHistory(next);
    setBusy(true);

    try {
      const { text, source } = await askFollowUp({
        insightSummary,
        contextSummary,
        history,
        question: q,
        focusGoals,
      });
      const assistantMsg = {
        role: 'assistant',
        content: text || "I didn't get a reply — try again?",
        source,
        ts: new Date().toISOString(),
      };
      const updated = [...next, assistantMsg];
      setHistory(updated);
      // Persist conversation on the insight row.
      const row = await db.aiInsights.get(insightId);
      if (row) {
        const payload = { ...(row.payload || {}), conversation: updated };
        await db.aiInsights.update(insightId, { payload });
      }
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    send(input);
  }

  if (!loaded) return null;

  const empty = history.length === 0;

  return (
    <div
      className="mt-3 pt-3 border-t border-white/5"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-widest text-accent-mental">
          Ask a follow-up
        </p>
        {history.length > 0 && (
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              if (!insightId) return;
              const row = await db.aiInsights.get(insightId);
              if (row) {
                const payload = { ...(row.payload || {}), conversation: [] };
                await db.aiInsights.update(insightId, { payload });
              }
              setHistory([]);
            }}
            className="text-[10px] text-textSecondary/40 hover:text-textSecondary/80 focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none rounded"
          >
            Clear
          </button>
        )}
      </div>

      {empty && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                send(s);
              }}
              disabled={busy}
              className="text-[11px] px-2.5 py-1.5 rounded-full bg-elevated/60 border border-white/5 text-textSecondary/80 hover:text-textPrimary hover:border-white/15 focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div
          ref={scrollerRef}
          className="space-y-2 max-h-72 overflow-y-auto mb-2 pr-1"
        >
          <AnimatePresence initial={false}>
            {history.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={
                  m.role === 'user'
                    ? 'ml-6 bg-accent-mental/15 border border-accent-mental/25 rounded-2xl rounded-tr-sm px-3 py-2'
                    : 'mr-6 bg-elevated/60 border border-white/5 rounded-2xl rounded-tl-sm px-3 py-2'
                }
              >
                <p className="text-[12px] leading-relaxed text-textPrimary whitespace-pre-wrap">
                  {m.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {busy && (
            <div className="mr-6 bg-elevated/60 border border-white/5 rounded-2xl rounded-tl-sm px-3 py-2">
              <div className="flex gap-1 items-end h-3">
                <Dot delay={0} />
                <Dot delay={120} />
                <Dot delay={240} />
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder={empty ? 'Or type your own question…' : 'Ask another question…'}
          disabled={busy}
          className="flex-1 bg-elevated/60 border border-white/5 rounded-xl px-3 py-2 text-[12px] outline-none focus-visible:border-accent-mental/40 focus-visible:ring-2 focus-visible:ring-accent-mental/30 disabled:opacity-50"
          aria-label="Ask a follow-up question"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          onClick={(e) => e.stopPropagation()}
          className="px-3 py-2 rounded-xl bg-accent-mental text-background text-[12px] font-medium disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <motion.span
      animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, delay: delay / 1000 }}
      className="w-1.5 h-1.5 rounded-full bg-textSecondary/60 inline-block"
    />
  );
}
