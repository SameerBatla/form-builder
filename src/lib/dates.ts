const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** "20 Nov 2026" */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}

/** "20 Nov 2026, 14:32" */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

/** "just now", "5 minutes ago", "yesterday"; falls back to the date after a week. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const elapsed = now.getTime() - new Date(iso).getTime()
  if (elapsed < MINUTE) {
    return 'just now'
  }
  if (elapsed < HOUR) {
    return relativeFormat.format(-Math.floor(elapsed / MINUTE), 'minute')
  }
  if (elapsed < DAY) {
    return relativeFormat.format(-Math.floor(elapsed / HOUR), 'hour')
  }
  if (elapsed < 7 * DAY) {
    return relativeFormat.format(-Math.floor(elapsed / DAY), 'day')
  }
  return formatDate(iso)
}

/** Today's local calendar date as YYYY-MM-DD (what <input type="date"> uses). */
export function toLocalIsoDate(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** "1 Mar 2026" from a YYYY-MM-DD calendar date (read as a local date, never shifted by time zone). */
export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return dateFormat.format(new Date(year, month - 1, day))
}
