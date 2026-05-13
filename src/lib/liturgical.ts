/*
 * Liturgical hours — the eight canonical hours of the day, used to give
 * the workforce a felt rhythm. Each block is three hours wide:
 *
 *   matins  · 00:00 – 03:00
 *   lauds   · 03:00 – 06:00
 *   prime   · 06:00 – 09:00
 *   terce   · 09:00 – 12:00
 *   sext    · 12:00 – 15:00
 *   none    · 15:00 – 18:00
 *   vespers · 18:00 – 21:00
 *   compline · 21:00 – 24:00
 *
 * Pure functions — safe to call at build time or in the browser.
 */

export const LITURGICAL_HOURS = [
  'matins',
  'lauds',
  'prime',
  'terce',
  'sext',
  'none',
  'vespers',
  'compline',
] as const

export type LiturgicalHour = (typeof LITURGICAL_HOURS)[number]

/** 0–7 index of the current liturgical block. */
export function currentHourIndex(now: Date = new Date()): number {
  return Math.floor(now.getUTCHours() / 3)
}

/** Liturgical block name for a given Date. */
export function currentHour(now: Date = new Date()): LiturgicalHour {
  return LITURGICAL_HOURS[currentHourIndex(now)]
}

/** Minutes until the next liturgical block begins. */
export function minutesUntilNextToll(now: Date = new Date()): number {
  const minutesIntoBlock = (now.getUTCHours() % 3) * 60 + now.getUTCMinutes()
  return 180 - minutesIntoBlock
}

/** Human-readable "47m" / "2h 14m" version of `minutesUntilNextToll`. */
export function nextTollLabel(now: Date = new Date()): string {
  const m = minutesUntilNextToll(now)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

/** One-line consequence for the liturgical toll countdown. */
export function nextTollNote(): string {
  return 'Opens the next liturgical block. Scores pin at toll.'
}
