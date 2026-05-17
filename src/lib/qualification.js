export const PUBLIC_WALL_SCORE_MIN = 0.5

export function isQualifiedScore(score) {
  return typeof score === 'number' && Number.isFinite(score) && score >= PUBLIC_WALL_SCORE_MIN
}

export function hasAnyScore(score) {
  return typeof score === 'number' && Number.isFinite(score)
}
