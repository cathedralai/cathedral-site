import { isQualifiedScore } from './qualification.js'

export const WALL_CELL_COUNT = 72
export const WALL_FRESH_MS = 30 * 60 * 1000
const HOUR_24_MS = 24 * 60 * 60 * 1000

export function pickQualifiedLeaderboard(items, limit = WALL_CELL_COUNT) {
  const now = Date.now()
  return items
    .filter((r) => isQualifiedScore(r.current_score))
    .slice(0, limit)
    .map((r) => ({
      agentId: r.agent_id,
      displayName: r.display_name,
      hotkey: r.miner_hotkey,
      score: r.current_score ?? 0,
      rank: r.current_rank ?? 0,
      lastEvalAt: r.last_eval_at ?? '',
      fresh:
        !!r.last_eval_at &&
        now - new Date(r.last_eval_at).getTime() < WALL_FRESH_MS,
    }))
}

export function wallStatsFromFeed(feed, laid, now = Date.now()) {
  const recent = feed.filter(
    (e) => now - new Date(e.ran_at).getTime() < HOUR_24_MS,
  )
  const accepted24h = recent.filter((e) =>
    isQualifiedScore(e.weighted_score),
  ).length
  return {
    eval24h: recent.length,
    accepted24h,
    rejected24h: recent.length - accepted24h,
  }
}

export function wallLiveStats(scored, feed, now = Date.now()) {
  const laid = scored.length
  const open = Math.max(0, WALL_CELL_COUNT - laid)
  return { laid, open, ...wallStatsFromFeed(feed, laid, now) }
}

export function wallGridFingerprint(scored, openCount) {
  const head = scored
    .map((s) => `${s.agentId}:${s.rank}:${s.score.toFixed(2)}:${s.lastEvalAt}`)
    .join('|')
  return `${scored.length}/${openCount}:${head}`
}

export function wallPressureAria(stats) {
  return `${stats.laid} crowned on wall. ${stats.accepted24h} qualified in 24h. ${stats.rejected24h} below threshold in 24h.`
}

export function wallLegendAria(stats) {
  return `${stats.laid} laid stones, ${stats.open} bare seats`
}

/** First grid row stays at full mason-mark strength. */
export const WALL_FRONT_ROW = 12

/** Only the procession/top ranks get the wandering border trace. */
export const WALL_TRACE_SLOTS = 3

function tierClass(score) {
  if (score >= 0.75) return 'tier-high'
  if (score >= 0.5) return 'tier-mid'
  return 'tier-low'
}

/**
 * Wall cell classes for SSR and live hydration. A full leaderboard still
 * reads as masonry: front row crowned, deeper rows settled and quieter.
 */
export function wallStonePresentation(
  index,
  { fresh, score },
  laidCount,
) {
  const topThree = index < WALL_TRACE_SLOTS
  const frontRow = index < WALL_FRONT_ROW
  const parts = ['stone', 'scored']
  if (fresh && topThree) parts.push('fresh')
  parts.push(tierClass(score))
  if (topThree) parts.push('current')
  if (!frontRow) parts.push('stone-settled')
  const traceClaimed = Math.min(
    WALL_TRACE_SLOTS,
    Math.max(1, laidCount),
  )
  return {
    className: parts.join(' '),
    state: fresh && topThree ? 'fresh' : 'scored',
    style: `--cd-slot: ${index}; --cd-claimed: ${traceClaimed}`,
  }
}
