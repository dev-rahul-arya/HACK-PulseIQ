export function fmtHours(h) {
  if (h == null) return '—';
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  return `${hours}h ${minutes}m`;
}

export function fmtNumber(n, opts = {}) {
  if (n == null) return '—';
  return new Intl.NumberFormat(undefined, opts).format(n);
}

export function fmtRelativeDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function moodLabel(value) {
  // 1–5 scale.
  return ['😞 Low', '😕 Down', '😐 Neutral', '🙂 Good', '😄 Great'][value - 1] || '—';
}
