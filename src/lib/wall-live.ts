/**
 * Client-safe wall grid renderer for live hydration.
 */
import { masonMark } from './mason-marks'
import { stoneMark } from './stone-marks'
import {
  WALL_CELL_COUNT,
  pickQualifiedLeaderboard,
  wallGridFingerprint,
  wallLegendAria,
  wallLiveStats,
  wallPressureAria,
  wallStatsFromFeed,
  wallStonePresentation,
} from './wall-live-stats.js'

export {
  WALL_CELL_COUNT,
  WALL_FRESH_MS,
  WALL_FRONT_ROW,
  WALL_TRACE_SLOTS,
  pickQualifiedLeaderboard,
  wallGridFingerprint,
  wallLegendAria,
  wallLiveStats,
  wallPressureAria,
  wallStatsFromFeed,
  wallStonePresentation,
} from './wall-live-stats.js'

export type WallLeaderRow = {
  agent_id: string
  display_name: string
  miner_hotkey: string
  current_score: number | null
  current_rank: number | null
  last_eval_at: string | null
}

export type WallFeedRow = {
  agent_id: string
  ran_at: string
  weighted_score: number
}

export type WallScoredCell = ReturnType<typeof pickQualifiedLeaderboard>[number]

export type WallLiveStats = ReturnType<typeof wallLiveStats>

function escAttr(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

export function renderWallGridHtml(
  cardId: string,
  scored: WallScoredCell[],
): string {
  const claimedCount = Math.max(1, scored.length)
  const cells: string[] = []

  for (let i = 0; i < scored.length && i < WALL_CELL_COUNT; i++) {
    const s = scored[i]
    const pres = wallStonePresentation(i, s, claimedCount)
    const scoreStr = s.score.toFixed(2)
    const title = `Rank ${s.rank} · score ${scoreStr}`
    cells.push(
      `<button type="button" class="${pres.className}" data-i="${i}" data-state="${pres.state}" style="${pres.style}" data-agent-id="${escAttr(s.agentId)}" data-agent-name="${escAttr(s.displayName)}" data-agent-bio="" data-score="${scoreStr}" data-rank="${s.rank}" data-ran-at="${escAttr(s.lastEvalAt)}" data-title="${escAttr(title)}" data-agent-modal-open="${escAttr(s.agentId)}" aria-label="${escAttr(`${s.displayName}, rank ${s.rank}, score ${scoreStr}, open profile`)}">${masonMark(s.hotkey || s.agentId, { size: 28 })}</button>`,
    )
  }

  for (let i = scored.length; i < WALL_CELL_COUNT; i++) {
    const glyph = stoneMark(`${cardId}:open:${i}`, { size: 28, open: true })
    cells.push(
      `<button type="button" class="stone empty claimable" data-i="${i}" data-claim aria-label="Open seat, enlist your mason">${glyph}</button>`,
    )
  }

  return cells.join('')
}
