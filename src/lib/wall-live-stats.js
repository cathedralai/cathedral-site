import { isQualifiedScore } from './qualification.js'

export const WALL_CELL_COUNT = 72

/** Experiment: how many qualified masons render as laid stones on the grid. */
export const WALL_DISPLAY_LAID = 12

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

export function wallScoredForDisplay(
  qualified,
  cap = WALL_DISPLAY_LAID,
) {
  return qualified.slice(0, Math.min(cap, qualified.length))
}

export function wallLiveStats(qualified, feed, now = Date.now()) {
  const crowned = qualified.length
  const onWall = Math.min(WALL_DISPLAY_LAID, crowned)
  const open = Math.max(0, WALL_CELL_COUNT - onWall)
  return {
    crowned,
    onWall,
    open,
    ...wallStatsFromFeed(feed, crowned, now),
  }
}

export function wallGridFingerprint(scored, openCount) {
  const head = scored
    .map((s) => `${s.agentId}:${s.rank}:${s.score.toFixed(2)}:${s.lastEvalAt}`)
    .join('|')
  return `${scored.length}/${openCount}:${head}`
}

export function wallPressureAria(stats) {
  return `${stats.crowned} crowned on wall. ${stats.accepted24h} qualified in 24h. ${stats.rejected24h} below threshold in 24h.`
}

export function wallLegendAria(stats) {
  return `${stats.onWall} laid stones, ${stats.open} bare seats`
}
