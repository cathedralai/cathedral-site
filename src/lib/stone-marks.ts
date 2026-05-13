/*
 * Stone marks — deterministic stained-glass panels for wall cells.
 *
 * Each submission (or open slot) gets a lead-line motif derived from a
 * stable seed. Same seed → same panel, every time. No bitmaps, no
 * gradients, no glow.
 */
import { masonHash, masonRng } from './mason-marks'

export interface StoneMarkOptions {
  size?: number
  /** Lead-line stroke color. */
  lead?: string
  /** Panel fill; defaults to accent at low opacity. */
  glass?: string
  /** Open / claimable slots use lighter lead and no fill. */
  open?: boolean
  stroke?: number
}

const MOTIFS = [
  'rose',
  'quatrefoil',
  'trefoil',
  'lancet',
  'roundel',
  'oculus',
  'spoke',
  'quarry',
] as const

type Motif = (typeof MOTIFS)[number]

function pickMotif(r: () => number): Motif {
  return MOTIFS[Math.floor(r() * MOTIFS.length)]
}

function rosePanel(
  c: number,
  r: number,
  lead: string,
  glass: string,
  sw: number,
  open: boolean,
): string {
  const spokes = 6 + Math.floor(r * 3)
  const inner = r * 0.22
  const outer = r * 0.88
  const lines: string[] = []
  for (let i = 0; i < spokes; i++) {
    const a = (Math.PI * 2 * i) / spokes
    const x = c + Math.cos(a) * inner
    const y = c + Math.sin(a) * inner
    const x2 = c + Math.cos(a) * outer
    const y2 = c + Math.sin(a) * outer
    lines.push(
      `<line x1="${x.toFixed(2)}" y1="${y.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${lead}" stroke-width="${sw}" stroke-linecap="round"/>`,
    )
  }
  const fill = open
    ? ''
    : `<circle cx="${c}" cy="${c}" r="${(r * 0.55).toFixed(2)}" fill="${glass}" stroke="none"/>`
  return (
    fill +
    `<circle cx="${c}" cy="${c}" r="${(r * 0.88).toFixed(2)}" fill="none" stroke="${lead}" stroke-width="${sw}"/>` +
  `<circle cx="${c}" cy="${c}" r="${(r * 0.22).toFixed(2)}" fill="none" stroke="${lead}" stroke-width="${sw * 0.9}"/>` +
    lines.join('')
  )
}

function quatrefoilPanel(
  c: number,
  r: number,
  lead: string,
  glass: string,
  sw: number,
  open: boolean,
): string {
  const petal = r * 0.34
  const offset = r * 0.34
  const petals = [
    [c, c - offset],
    [c + offset, c],
    [c, c + offset],
    [c - offset, c],
  ]
  const fills = open
    ? ''
    : petals
        .map(
          ([x, y]) =>
            `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${petal.toFixed(2)}" fill="${glass}" stroke="none"/>`,
        )
        .join('')
  const strokes = petals
    .map(
      ([x, y]) =>
        `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${petal.toFixed(2)}" fill="none" stroke="${lead}" stroke-width="${sw}"/>`,
    )
    .join('')
  return (
    fills +
    strokes +
    `<circle cx="${c}" cy="${c}" r="${(r * 0.18).toFixed(2)}" fill="none" stroke="${lead}" stroke-width="${sw * 0.85}"/>`
  )
}

function trefoilPanel(
  c: number,
  r: number,
  lead: string,
  glass: string,
  sw: number,
  open: boolean,
): string {
  const petal = r * 0.36
  const lift = r * 0.28
  const pts = [
    [c, c - lift],
    [c + lift * 0.92, c + lift * 0.52],
    [c - lift * 0.92, c + lift * 0.52],
  ]
  const fills = open
    ? ''
    : pts
        .map(
          ([x, y]) =>
            `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${petal.toFixed(2)}" fill="${glass}" stroke="none"/>`,
        )
        .join('')
  const strokes = pts
    .map(
      ([x, y]) =>
        `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${petal.toFixed(2)}" fill="none" stroke="${lead}" stroke-width="${sw}"/>`,
    )
    .join('')
  return fills + strokes
}

function lancetPanel(
  c: number,
  r: number,
  lead: string,
  glass: string,
  sw: number,
  open: boolean,
): string {
  const w = r * 0.72
  const h = r * 1.02
  const x0 = c - w
  const x1 = c + w
  const y0 = c + h * 0.55
  const y1 = c - h * 0.55
  const path = `M ${x0.toFixed(2)} ${y0.toFixed(2)} Q ${c.toFixed(2)} ${y1.toFixed(2)} ${x1.toFixed(2)} ${y0.toFixed(2)} Z`
  const fill = open ? '' : `<path d="${path}" fill="${glass}" stroke="none"/>`
  return fill + `<path d="${path}" fill="none" stroke="${lead}" stroke-width="${sw}" stroke-linejoin="round"/>`
}

function roundelPanel(
  c: number,
  r: number,
  lead: string,
  glass: string,
  sw: number,
  open: boolean,
): string {
  const fill = open
    ? ''
    : `<circle cx="${c}" cy="${c}" r="${(r * 0.62).toFixed(2)}" fill="${glass}" stroke="none"/>`
  return (
    fill +
    `<circle cx="${c}" cy="${c}" r="${(r * 0.78).toFixed(2)}" fill="none" stroke="${lead}" stroke-width="${sw}"/>` +
    `<circle cx="${c}" cy="${c}" r="${(r * 0.34).toFixed(2)}" fill="none" stroke="${lead}" stroke-width="${sw * 0.85}"/>`
  )
}

function oculusPanel(
  c: number,
  r: number,
  lead: string,
  glass: string,
  sw: number,
  open: boolean,
): string {
  const rx = r * 0.78
  const ry = r * 0.42
  const fill = open
    ? ''
    : `<ellipse cx="${c}" cy="${c}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="${glass}" stroke="none"/>`
  return (
    fill +
    `<ellipse cx="${c}" cy="${c}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="none" stroke="${lead}" stroke-width="${sw}"/>` +
    `<line x1="${(c - rx).toFixed(2)}" y1="${c}" x2="${(c + rx).toFixed(2)}" y2="${c}" stroke="${lead}" stroke-width="${sw * 0.75}" stroke-linecap="round"/>`
  )
}

function spokePanel(
  c: number,
  r: number,
  lead: string,
  glass: string,
  sw: number,
  open: boolean,
  flip: boolean,
): string {
  const a0 = flip ? -Math.PI / 4 : Math.PI / 4
  const a1 = flip ? (Math.PI * 3) / 4 : (Math.PI * 5) / 4
  const x0 = c + Math.cos(a0) * r * 0.2
  const y0 = c + Math.sin(a0) * r * 0.2
  const x1 = c + Math.cos(a0) * r * 0.9
  const y1 = c + Math.sin(a0) * r * 0.9
  const x2 = c + Math.cos(a1) * r * 0.9
  const y2 = c + Math.sin(a1) * r * 0.9
  const path = `M ${x0.toFixed(2)} ${y0.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${(r * 0.9).toFixed(2)} ${(r * 0.9).toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
  const fill = open ? '' : `<path d="${path}" fill="${glass}" stroke="none"/>`
  return fill + `<path d="${path}" fill="none" stroke="${lead}" stroke-width="${sw}" stroke-linejoin="round"/>`
}

function quarryPanel(
  c: number,
  r: number,
  lead: string,
  glass: string,
  sw: number,
  open: boolean,
): string {
  const inset = r * 0.22
  const min = c - r + inset
  const max = c + r - inset
  const fill = open
    ? ''
    : `<polygon points="${min.toFixed(2)},${c.toFixed(2)} ${c.toFixed(2)},${min.toFixed(2)} ${max.toFixed(2)},${c.toFixed(2)} ${c.toFixed(2)},${max.toFixed(2)}" fill="${glass}" stroke="none"/>`
  return (
    fill +
    `<line x1="${min.toFixed(2)}" y1="${min.toFixed(2)}" x2="${max.toFixed(2)}" y2="${max.toFixed(2)}" stroke="${lead}" stroke-width="${sw}" stroke-linecap="round"/>` +
    `<line x1="${max.toFixed(2)}" y1="${min.toFixed(2)}" x2="${min.toFixed(2)}" y2="${max.toFixed(2)}" stroke="${lead}" stroke-width="${sw}" stroke-linecap="round"/>` +
    `<circle cx="${c}" cy="${c}" r="${(r * 0.12).toFixed(2)}" fill="${lead}" stroke="none"/>`
  )
}

function frame(size: number, lead: string, sw: number): string {
  const inset = size * 0.08
  return `<rect x="${inset.toFixed(2)}" y="${inset.toFixed(2)}" width="${(size - inset * 2).toFixed(2)}" height="${(size - inset * 2).toFixed(2)}" fill="none" stroke="${lead}" stroke-width="${sw * 0.9}"/>`
}

/**
 * Build a deterministic stained-glass panel for a wall stone.
 */
export function stoneMark(
  seed: string,
  {
    size = 22,
    lead = 'var(--dim)',
    glass = 'var(--accent)',
    open = false,
    stroke,
  }: StoneMarkOptions = {},
): string {
  const r = masonRng(masonHash(seed || 'cathedral-stone'))
  const c = size / 2
  const radius = size * 0.42
  const sw = stroke ?? Math.max(0.55, size * 0.05)
  const leadColor = open ? 'var(--faint)' : lead
  const glassFill = open ? 'none' : glass
  const motif = pickMotif(r)
  const flip = r() > 0.5

  let inner = ''
  if (motif === 'rose') inner = rosePanel(c, radius, leadColor, glassFill, sw, open)
  else if (motif === 'quatrefoil') inner = quatrefoilPanel(c, radius, leadColor, glassFill, sw, open)
  else if (motif === 'trefoil') inner = trefoilPanel(c, radius, leadColor, glassFill, sw, open)
  else if (motif === 'lancet') inner = lancetPanel(c, radius, leadColor, glassFill, sw, open)
  else if (motif === 'roundel') inner = roundelPanel(c, radius, leadColor, glassFill, sw, open)
  else if (motif === 'oculus') inner = oculusPanel(c, radius, leadColor, glassFill, sw, open)
  else if (motif === 'spoke') inner = spokePanel(c, radius, leadColor, glassFill, sw, open, flip)
  else inner = quarryPanel(c, radius, leadColor, glassFill, sw, open)

  const panelOpacity = open ? '0.42' : '0.78'
  const wrapped =
    open || glassFill === 'none'
      ? inner
      : inner.replaceAll(`fill="${glass}"`, `fill="${glass}" fill-opacity="${panelOpacity}"`)

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">${frame(size, leadColor, sw)}${wrapped}</svg>`
}
