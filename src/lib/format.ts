/*
 * Tiny formatting helpers shared across pages. Mostly relative-time and
 * truncation logic so every page renders timestamps and hotkeys the same way.
 */

const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function relativeTime(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime()
  const delta = Math.max(0, now - t)
  if (delta < MINUTE) return 'just now'
  if (delta < HOUR) return `${Math.floor(delta / MINUTE)}m ago`
  if (delta < DAY) return `${Math.floor(delta / HOUR)}h ago`
  const days = Math.floor(delta / DAY)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toISOString().slice(0, 10)
}

export function truncateMiddle(value: string, head: number = 6, tail: number = 4): string {
  if (value.length <= head + tail + 1) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—'
  return score.toFixed(1)
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export function shortHash(hash: string, head: number = 8, tail: number = 0): string {
  // Hashes get a slightly longer head than ss58 because that's what feels
  // canonically "verified" without dominating a row.
  if (!hash) return ''
  if (hash.length <= head + tail + 1) return hash
  return tail ? `${hash.slice(0, head)}…${hash.slice(-tail)}` : `${hash.slice(0, head)}…`
}
