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

/** ms until local midnight (next day, 00:00). Used to display countdown
 *  on the locked Done screen. */
export function msUntilMidnight(): number {
  const now = new Date();
  const tmrw = new Date(now);
  tmrw.setDate(tmrw.getDate() + 1);
  tmrw.setHours(0, 0, 0, 0);
  return tmrw.getTime() - now.getTime();
}

/** Compact "Xh Ym" / "Xm" formatter for the countdown. */
export function formatCountdown(ms: number, locale: 'zh' | 'en'): string {
  if (ms <= 0) return locale === 'zh' ? '不到 1 分钟' : 'under 1 min';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (locale === 'zh') {
    if (h > 0) return `${h} 小时 ${m} 分`;
    return `${m} 分`;
  }
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** "drew Xh ago" — only used when the player re-opens on a same-day
 *  locked state hours later. Returns null if < 5 min so a fresh reveal
 *  doesn't show "drawn 0m ago" awkwardly. */
export function timeSince(ts: number, locale: 'zh' | 'en'): string | null {
  const diff = Date.now() - ts;
  if (diff < 5 * 60 * 1000) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (locale === 'zh') {
    if (h > 0) return `${h} 小时前抽到`;
    return `${m} 分钟前抽到`;
  }
  if (h > 0) return `drawn ${h}h ago`;
  return `drawn ${m}m ago`;
}
