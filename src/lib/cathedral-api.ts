/*
 * Typed Cathedral API client.
 *
 * Built against `api.cathedral.computer` per CONTRACTS.md §2.
 *
 * Mode toggle:
 *   PUBLIC_CATHEDRAL_API_MOCK=true  -> route every call through ./cathedral-api-mock
 *   PUBLIC_CATHEDRAL_API_URL        -> live base URL (default http://localhost:9090)
 *
 * Mock-mode shapes are byte-identical to live mode by construction; only the
 * data values differ. Integration agent flips one env var at deploy time.
 */

import type {
  AgentProfile,
  AgentsListPage,
  AgentSort,
  CardEvalSpec,
  CardOverview,
  EvalOutput,
  FeedPage,
  LeaderboardPage,
  MerkleAnchor,
  SubmissionResponse,
} from './types'
import * as mock from './cathedral-api-mock'

const API_BASE: string =
  (import.meta.env.PUBLIC_CATHEDRAL_API_URL as string | undefined) ||
  'http://localhost:9090'

const USE_MOCK: boolean =
  (import.meta.env.PUBLIC_CATHEDRAL_API_MOCK as string | undefined) === 'true'

class CathedralApiError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(`cathedral-api ${status}: ${detail}`)
    this.status = status
    this.detail = detail
  }
}

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const resp = await fetch(url, init)
  if (!resp.ok) {
    let detail = ''
    try {
      const body = (await resp.json()) as { detail?: string }
      detail = body.detail ?? ''
    } catch {
      // ignore body parse failure
    }
    throw new CathedralApiError(resp.status, detail || resp.statusText)
  }
  return (await resp.json()) as T
}

// -------------------------------------------------------------------------
// Reads
// -------------------------------------------------------------------------

export async function fetchAgent(id: string): Promise<AgentProfile> {
  if (USE_MOCK) return mock.fetchAgent(id)
  return jsonFetch<AgentProfile>(`/v1/agents/${encodeURIComponent(id)}`)
}

export async function fetchAgents(params: {
  card?: string
  sort?: AgentSort
  limit?: number
  offset?: number
} = {}): Promise<AgentsListPage> {
  if (USE_MOCK) return mock.fetchAgents(params)
  const q = new URLSearchParams()
  if (params.card) q.set('card', params.card)
  if (params.sort) q.set('sort', params.sort)
  if (params.limit !== undefined) q.set('limit', String(params.limit))
  if (params.offset !== undefined) q.set('offset', String(params.offset))
  const qs = q.toString()
  return jsonFetch<AgentsListPage>(`/v1/agents${qs ? `?${qs}` : ''}`)
}

export async function fetchCardOverview(cardId: string): Promise<CardOverview> {
  if (USE_MOCK) return mock.fetchCardOverview(cardId)
  return jsonFetch<CardOverview>(`/v1/cards/${encodeURIComponent(cardId)}`)
}

export async function fetchCardHistory(
  cardId: string,
  params: { agent_id?: string; limit?: number; since?: string } = {},
): Promise<FeedPage> {
  if (USE_MOCK) return mock.fetchCardHistory(cardId, params)
  const q = new URLSearchParams()
  if (params.agent_id) q.set('agent_id', params.agent_id)
  if (params.limit !== undefined) q.set('limit', String(params.limit))
  if (params.since) q.set('since', params.since)
  const qs = q.toString()
  return jsonFetch<FeedPage>(
    `/v1/cards/${encodeURIComponent(cardId)}/history${qs ? `?${qs}` : ''}`,
  )
}

export async function fetchCardEvalSpec(cardId: string): Promise<CardEvalSpec> {
  if (USE_MOCK) return mock.fetchCardEvalSpec(cardId)
  return jsonFetch<CardEvalSpec>(
    `/v1/cards/${encodeURIComponent(cardId)}/eval-spec`,
  )
}

export async function fetchCardFeed(
  cardId: string,
  params: { since?: string; limit?: number } = {},
): Promise<FeedPage> {
  if (USE_MOCK) return mock.fetchCardFeed(cardId, params)
  const q = new URLSearchParams()
  if (params.since) q.set('since', params.since)
  if (params.limit !== undefined) q.set('limit', String(params.limit))
  const qs = q.toString()
  return jsonFetch<FeedPage>(
    `/v1/cards/${encodeURIComponent(cardId)}/feed${qs ? `?${qs}` : ''}`,
  )
}

export async function fetchLeaderboard(
  cardId: string,
  limit: number = 50,
): Promise<LeaderboardPage> {
  if (USE_MOCK) return mock.fetchLeaderboard(cardId, limit)
  const q = new URLSearchParams({ card: cardId, limit: String(limit) })
  return jsonFetch<LeaderboardPage>(`/v1/leaderboard?${q.toString()}`)
}

export async function fetchRecentEvals(params: {
  since: string
  limit?: number
}): Promise<{
  items: EvalOutput[]
  next_since: string | null
  merkle_epoch_latest: number
}> {
  if (USE_MOCK) return mock.fetchRecentEvals(params)
  const q = new URLSearchParams({ since: params.since })
  if (params.limit !== undefined) q.set('limit', String(params.limit))
  return jsonFetch(`/v1/leaderboard/recent?${q.toString()}`)
}

export async function fetchMerkleAnchor(epoch: number): Promise<MerkleAnchor> {
  if (USE_MOCK) return mock.fetchMerkleAnchor(epoch)
  return jsonFetch<MerkleAnchor>(`/v1/merkle/${epoch}`)
}

export async function fetchMinerAgents(
  hotkey: string,
): Promise<{ items: AgentProfile[] }> {
  if (USE_MOCK) return mock.fetchMinerAgents(hotkey)
  return jsonFetch<{ items: AgentProfile[] }>(
    `/v1/miners/${encodeURIComponent(hotkey)}/agents`,
  )
}

export async function fetchHomeFeed(limit: number = 12): Promise<EvalOutput[]> {
  if (USE_MOCK) return mock.fetchHomeFeed(limit)
  // The contract exposes /v1/leaderboard/recent for cross-card feeds. Use a
  // 24h lookback window for the home page.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const q = new URLSearchParams({ since, limit: String(limit) })
  const data = await jsonFetch<{
    items: EvalOutput[]
    next_since: string | null
    merkle_epoch_latest: number
  }>(`/v1/leaderboard/recent?${q.toString()}`)
  return data.items
}

export async function fetchAvailableCards(): Promise<CardOverview[]> {
  // Convenience helper. Backend doesn't expose a single list endpoint, so we
  // resolve from the locked v1 card_id set (CONTRACTS §9 lock #12).
  if (USE_MOCK) return mock.fetchAvailableCards()
  const ids = [
    'eu-ai-act',
    'us-ai-eo',
    'uk-ai-whitepaper',
    'singapore-pdpc',
    'japan-meti-mic',
  ]
  const settled = await Promise.allSettled(ids.map((id) => fetchCardOverview(id)))
  return settled
    .filter(
      (s): s is PromiseFulfilledResult<CardOverview> => s.status === 'fulfilled',
    )
    .map((s) => s.value)
}

// -------------------------------------------------------------------------
// Writes
// -------------------------------------------------------------------------

export type SubmitOptions = {
  bundle: File
  card_id: string
  display_name: string
  bio?: string
  logo?: File | null
  hotkey: string // ss58
  signature: string // base64 sr25519 over canonical_json(payload)
  submitted_at: string // ISO 8601 (must match the value that was signed)
}

export async function submitAgent(opts: SubmitOptions): Promise<SubmissionResponse> {
  if (USE_MOCK) return mock.submitAgent(opts)
  const body = new FormData()
  body.append('bundle', opts.bundle)
  body.append('card_id', opts.card_id)
  body.append('display_name', opts.display_name)
  if (opts.bio) body.append('bio', opts.bio)
  if (opts.logo) body.append('logo', opts.logo)
  body.append('submitted_at', opts.submitted_at)
  return jsonFetch<SubmissionResponse>('/v1/agents/submit', {
    method: 'POST',
    headers: {
      'X-Cathedral-Signature': opts.signature,
      'X-Cathedral-Hotkey': opts.hotkey,
    },
    body,
  })
}

export { CathedralApiError, API_BASE, USE_MOCK }
