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

/** Compact countdown formatter — borrows Hour Capsule's pattern so the
 *  final stretch ticks visibly. Far from midnight: "Xh Ym" / "Xm". Last
 *  5 minutes: mm:ss with each second visibly counting down (the host
 *  component runs setInterval at 1s for this window). User reported
 *  the previous "X 分" rounding to "0 分" with 30+ seconds still on the
 *  clock looked like the countdown was lying — mm:ss makes the last
 *  minute legibly trickle through. */
export function formatCountdown(ms: number, locale: 'zh' | 'en'): string {
  if (ms <= 0) return '00:00';
  // Last 5 minutes — switch to mm:ss for tension.
  if (ms <= 5 * 60000) {
    const totalSec = Math.ceil(ms / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    return `${mm}:${ss.toString().padStart(2, '0')}`;
  }
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
