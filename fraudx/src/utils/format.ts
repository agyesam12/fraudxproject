export function timeAgo(ts: number, now = Date.now()): string {
  const mins = Math.round((now - ts) / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function fullTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const initialOf = (sender: string) => {
  const ch = sender.replace(/^\+/, '').trim()[0] ?? '?';
  return /\d/.test(ch) ? '#' : ch.toUpperCase();
};
