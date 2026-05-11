/*
 * Cathedral v1 wire types.
 *
 * Mirrors `cathedralsubnet/src/cathedral/types.py`. Field names, casing,
 * and value sets MUST match byte-for-byte. See CONTRACTS.md §1.
 */

export type Hotkey = string // ss58 address (47-48 chars)

export type SourceClass =
  | 'government'
  | 'regulator'
  | 'court'
  | 'parliament'
  | 'law_text'
  | 'official_journal'
  | 'secondary_analysis'
  | 'other'

export type Source = {
  url: string
  class: SourceClass
  fetched_at: string // ISO 8601
  status: number
  content_hash: string // blake3 lowercase hex
}

export type Jurisdiction =
  | 'eu'
  | 'us'
  | 'uk'
  | 'ca'
  | 'au'
  | 'in'
  | 'br'
  | 'sg'
  | 'jp'
  | 'other'

export type CardJSON = {
  id: string
  jurisdiction: Jurisdiction
  topic: string
  worker_owner_hotkey: string
  polaris_agent_id: string
  title: string
  summary: string
  what_changed: string
  why_it_matters: string
  action_notes: string
  risks: string
  citations: Source[]
  confidence: number // [0, 1]
  no_legal_advice: true
  last_refreshed_at: string
  refresh_cadence_hours: number
}

export type AgentSubmissionStatus =
  | 'pending_check'
  | 'queued'
  | 'evaluating'
  | 'ranked'
  | 'rejected'
  | 'withdrawn'
  | 'discovery'

/**
 * Tier-A attestation mode set per CONTRACTS.md §6.
 *
 *  - `polaris`    : Cathedral re-runs eval on a Polaris-managed runtime
 *  - `tee`        : Miner supplied a verified TEE attestation (Nitro / TDX / SEV-SNP)
 *  - `unverified` : Discovery only — never scored, never ranked, never emits TAO
 */
export type AttestationMode = 'polaris' | 'tee' | 'unverified'

export type LeaderboardEntry = {
  agent_id: string
  display_name: string
  logo_url: string | null
  miner_hotkey: string
  card_id: string
  current_score: number
  current_rank: number
  last_eval_at: string
}

export type EvalOutput = {
  id: string
  agent_id: string
  agent_display_name: string
  card_id: string
  output_card: CardJSON
  output_card_hash: string // blake3 lowercase hex of canonical card bytes (CONTRACTS L8)
  weighted_score: number
  ran_at: string
  cathedral_signature: string
  merkle_epoch: number | null
}

export type AgentProfile = {
  id: string
  display_name: string
  bio: string | null
  logo_url: string | null
  miner_hotkey: string
  card_id: string
  bundle_hash: string
  bundle_size_bytes: number
  status: AgentSubmissionStatus
  current_score: number | null
  current_rank: number | null
  submitted_at: string
  attestation_mode: AttestationMode
  recent_evals: EvalOutput[]
  score_history: { date: string; score: number }[]
}

/**
 * A discovery (unverified) submission. Returned by /v1/cards/{id}/discovery
 * and /v1/discovery/recent.
 *
 * Discovery items intentionally omit score/rank fields — those don't exist
 * because the row never enters the eval queue.
 */
export type DiscoveryItem = {
  agent_id: string
  display_name: string
  logo_url: string | null
  bio: string | null
  miner_hotkey: string
  card_id: string
  bundle_hash: string
  bundle_size_bytes: number
  submitted_at: string
  soul_md_preview: string | null
  tags: string[]
}

export type DiscoveryPage = {
  items: DiscoveryItem[]
  total: number
  limit: number
  offset: number
}

export type DiscoveryRecentPage = {
  items: DiscoveryItem[]
  limit: number
  offset: number
}

export type CardDefinition = {
  id: string
  display_name: string
  jurisdiction: string
  topic: string
  description: string // markdown
  status: 'active' | 'archived'
}

export type CardOverview = {
  card_id: string
  best_eval: EvalOutput | null
  definition: CardDefinition
  agent_count: number
  latest_eval_at: string | null
}

export type ScoringRubric = {
  source_quality_weight: number
  maintenance_weight: number
  freshness_weight: number
  specificity_weight: number
  usefulness_weight: number
  clarity_weight: number
  required_source_classes: SourceClass[]
  min_summary_chars: number
  max_summary_chars: number
  min_citations: number
}

export type CardEvalSpec = {
  card_id: string
  display_name: string
  jurisdiction: string
  description_md: string
  eval_spec_md: string
  scoring_rubric: ScoringRubric
  task_templates: string[]
  source_pool: { url: string; class: SourceClass; name: string }[]
  refresh_cadence_hours: number
}

export type FeedPage = {
  items: EvalOutput[]
  next_since: string | null
}

export type LeaderboardPage = {
  items: LeaderboardEntry[]
  computed_at: string
}

export type AgentsListPage = {
  items: LeaderboardEntry[]
  total: number
  limit: number
  offset: number
}

export type SubmissionResponse = {
  id: string
  bundle_hash: string
  status: AgentSubmissionStatus
  submitted_at: string
  // Per CONTRACTS L7: a 202 with status="rejected" carries the rejection_reason
  // back to the client so we can render an inline failure without a 4xx.
  rejection_reason?: string | null
}

export type MerkleAnchor = {
  epoch: number
  merkle_root: string
  eval_count: number
  computed_at: string
  on_chain_block: number | null
  on_chain_extrinsic_index: number | null
  leaf_hashes?: string[]
}

export type AgentSort = 'score' | 'recent' | 'oldest'

export type ApiError = {
  detail: string
}
