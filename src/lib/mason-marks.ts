/*
 * Mason marks — procedural geometric SVG signatures.
 *
 * Each agent gets a deterministic mark derived from its hotkey (or any
 * stable identifier). The mark is three randomly-chosen primitives
 * (diagonal, vertical, horizontal, cross, chevron, arc, dot, triangle)
 * stamped on top of each other inside a square viewBox. Same hotkey →
 * same mark, every time.
 *
 * The mark function is pure and works in three contexts:
 *   - Astro frontmatter (server-side, build-time SSR)
 *   - Client-side `<script is:inline>` blocks (when injected as a
 *     module) — though for client use we re-export the same function
 *     via a small inline IIFE in the consuming component
 *   - Tests / unit checks
 *
 * Returned string is a complete `<svg>` element with no external
 * dependencies; embed directly via `set:html` / `innerHTML`.
 */

const FNV_PRIME = 16777619
const FNV_OFFSET = 2166136261

function hash(str: string): number {
  let h = FNV_OFFSET >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, FNV_PRIME) >>> 0
  }
  return h
}

function mulberryRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0
    s = Math.imul(s ^ (s >>> 13), 3266489909) >>> 0
    s = (s ^ (s >>> 16)) >>> 0
    return s / 4294967296
  }
}

export interface MasonMarkOptions {
  size?: number
  color?: string
  /** Stroke width override; defaults scale with size. */
  stroke?: number
  /** When true, the SVG itself is omitted and only the inner primitives
   *  are returned — useful when caller already has a wrapping <svg>. */
  innerOnly?: boolean
}

/**
 * Build a deterministic geometric mark for `seed`.
 *
 * The output is intentionally primitive — three glyphs over a square —
 * so masons read as a family, not as individual logos. No bitmaps,
 * no gradients, no shadows.
 */
export function masonMark(
  seed: string,
  { size = 22, color = 'var(--accent)', stroke, innerOnly = false }: MasonMarkOptions = {},
): string {
  const r = mulberryRng(hash(seed || 'cathedral'))
  const c = size / 2
  const inset = size * 0.18
  const min = inset
  const max = size - inset
  const sw = stroke ?? Math.max(0.6, size * 0.045)

  const kinds = [
    'diag',
    'vert',
    'horz',
    'cross',
    'chevron',
    'arc',
    'dot',
    'triangle',
  ] as const
  type Kind = (typeof kinds)[number]

  const picks: Kind[] = []
  while (picks.length < 3) {
    const k = kinds[Math.floor(r() * kinds.length)]
    if (!picks.includes(k)) picks.push(k)
  }

  const out: string[] = []
  for (const k of picks) {
    if (k === 'diag') {
      out.push(
        r() > 0.5
          ? `<line x1="${min}" y1="${min}" x2="${max}" y2="${max}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`
          : `<line x1="${max}" y1="${min}" x2="${min}" y2="${max}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`,
      )
    } else if (k === 'vert') {
      const x = min + r() * (max - min)
      out.push(
        `<line x1="${x}" y1="${min}" x2="${x}" y2="${max}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`,
      )
    } else if (k === 'horz') {
      const y = min + r() * (max - min)
      out.push(
        `<line x1="${min}" y1="${y}" x2="${max}" y2="${y}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`,
      )
    } else if (k === 'cross') {
      out.push(
        `<line x1="${c}" y1="${min}" x2="${c}" y2="${max}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`,
      )
      out.push(
        `<line x1="${min}" y1="${c}" x2="${max}" y2="${c}" stroke="${color}" stroke-width="${sw * 0.85}" stroke-linecap="round"/>`,
      )
    } else if (k === 'chevron') {
      const dir = r() > 0.5 ? 1 : -1
      const y = dir > 0 ? min : max
      const y2 = dir > 0 ? max : min
      out.push(
        `<polyline points="${min},${y2} ${c},${y} ${max},${y2}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`,
      )
    } else if (k === 'arc') {
      out.push(
        r() > 0.5
          ? `<path d="M ${min} ${c} Q ${c} ${min} ${max} ${c}" fill="none" stroke="${color}" stroke-width="${sw * 0.95}" stroke-linecap="round"/>`
          : `<path d="M ${min} ${c} Q ${c} ${max} ${max} ${c}" fill="none" stroke="${color}" stroke-width="${sw * 0.95}" stroke-linecap="round"/>`,
      )
    } else if (k === 'dot') {
      out.push(
        `<circle cx="${c}" cy="${c}" r="${Math.max(1.2, size * 0.07)}" fill="${color}"/>`,
      )
    } else if (k === 'triangle') {
      const flip = r() > 0.5
      const pts = flip
        ? `${min},${max} ${c},${min} ${max},${max}`
        : `${min},${min} ${c},${max} ${max},${min}`
      out.push(
        `<polygon points="${pts}" fill="none" stroke="${color}" stroke-width="${sw * 0.95}" stroke-linejoin="round"/>`,
      )
    }
  }

  const inner = out.join('')
  if (innerOnly) return inner
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">${inner}</svg>`
}

// Re-export the helpers in case a caller wants to seed a custom palette
// from the same hash.
export { hash as masonHash, mulberryRng as masonRng }
