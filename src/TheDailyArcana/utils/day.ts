// Local-day key. YYYY-MM-DD in the device's local time zone.
//
// IMPORTANT: lock derivation reads ONLY this value. Never OR it with a
// platform aggregate stat — see daily-lock-trap memory rule.
export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isToday(key: string | undefined): boolean {
  return !!key && key === todayKey();
}

export function formatDate(key: string, locale: 'zh' | 'en'): string {
  const [y, m, d] = key.split('-');
  if (locale === 'zh') return `${y}.${m}.${d}`;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}
