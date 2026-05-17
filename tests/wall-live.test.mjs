import assert from 'node:assert/strict'
import test from 'node:test'

import {
  WALL_CELL_COUNT,
  pickQualifiedLeaderboard,
  wallGridFingerprint,
  wallLiveStats,
  wallStatsFromFeed,
} from '../src/lib/wall-live-stats.js'

test('pickQualifiedLeaderboard caps at 60 and filters below 0.5', () => {
  const rows = Array.from({ length: 100 }, (_, i) => ({
    agent_id: `agent-${i}`,
    display_name: `mason-${i}`,
    miner_hotkey: `hk-${i}`,
    current_score: i < 80 ? 1.0 : 0.31,
    current_rank: i + 1,
    last_eval_at: '2026-05-17T18:00:00Z',
  }))
  const scored = pickQualifiedLeaderboard(rows)
  assert.equal(scored.length, 60)
  assert.equal(scored[0].rank, 1)
})

test('wallStatsFromFeed counts 24h accepted vs rejected', () => {
  const now = Date.parse('2026-05-17T19:00:00Z')
  const feed = [
    { agent_id: 'a', ran_at: '2026-05-17T18:59:00Z', weighted_score: 1 },
    { agent_id: 'b', ran_at: '2026-05-17T12:00:00Z', weighted_score: 0.31 },
    { agent_id: 'c', ran_at: '2026-05-15T12:00:00Z', weighted_score: 1 },
  ]
  const s = wallStatsFromFeed(feed, 2, now)
  assert.equal(s.eval24h, 2)
  assert.equal(s.accepted24h, 1)
  assert.equal(s.rejected24h, 1)
})

test('wallGridFingerprint changes when roster changes', () => {
  const a = pickQualifiedLeaderboard([
    {
      agent_id: 'a1',
      display_name: 'one',
      miner_hotkey: 'hk1',
      current_score: 1,
      current_rank: 1,
      last_eval_at: '2026-05-17T18:00:00Z',
    },
  ])
  const b = pickQualifiedLeaderboard([
    {
      agent_id: 'a2',
      display_name: 'two',
      miner_hotkey: 'hk2',
      current_score: 1,
      current_rank: 1,
      last_eval_at: '2026-05-17T18:01:00Z',
    },
  ])
  assert.notEqual(
    wallGridFingerprint(a, WALL_CELL_COUNT - 1),
    wallGridFingerprint(b, WALL_CELL_COUNT - 1),
  )
})

test('wallLiveStats reports laid and open counts', () => {
  const scored = pickQualifiedLeaderboard([
    {
      agent_id: 'a1',
      display_name: 'one',
      miner_hotkey: 'hk1',
      current_score: 0.9,
      current_rank: 1,
      last_eval_at: '2026-05-17T18:00:00Z',
    },
  ])
  const stats = wallLiveStats(scored, [])
  assert.equal(stats.laid, 1)
  assert.equal(stats.open, WALL_CELL_COUNT - 1)
})
