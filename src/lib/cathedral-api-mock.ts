/*
 * Mock backend for the cathedral API.
 *
 * Returns shapes that exactly match CONTRACTS.md §1 + §2 so the frontend can
 * be built and the integration agent can flip a single env var when the real
 * backend ships.
 *
 * Determinism: a small seeded PRNG keeps the mock output stable between page
 * loads of the same agent/card so screenshots and links don't drift.
 */

import type {
  AgentProfile,
  AgentsListPage,
  AgentSort,
  CardDefinition,
  CardEvalSpec,
  CardJSON,
  CardOverview,
  DiscoveryItem,
  DiscoveryPage,
  DiscoveryRecentPage,
  EvalOutput,
  FeedPage,
  Jurisdiction,
  LeaderboardEntry,
  LeaderboardPage,
  MerkleAnchor,
  ScoringRubric,
  Source,
  SubmissionResponse,
} from './types'
import type { SubmitOptions } from './cathedral-api'

// ---------- deterministic PRNG ----------

function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pickFrom<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!
}

function hex(rng: () => number, len: number): string {
  const chars = '0123456789abcdef'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(rng() * 16)]
  return out
}

function uuidish(rng: () => number): string {
  const seg = (n: number) => hex(rng, n)
  return `${seg(8)}-${seg(4)}-${seg(4)}-${seg(4)}-${seg(12)}`
}

function ss58(rng: () => number): string {
  // Not a real ss58 — just a plausible-looking 47-char string. The backend
  // produces real ones; the frontend just renders truncations.
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'
  let out = '5'
  for (let i = 0; i < 46; i++) out += chars[Math.floor(rng() * chars.length)]
  return out
}

// ---------- card definitions ----------

type LockedCard = {
  id: string
  display_name: string
  jurisdiction: Jurisdiction
  topic: string
  description_md: string
  task_templates: string[]
  source_pool: { url: string; class: Source['class']; name: string }[]
}

const CARDS: LockedCard[] = [
  {
    id: 'eu-ai-act',
    display_name: 'EU AI Act',
    jurisdiction: 'eu',
    topic: 'AI regulation',
    description_md:
      'Tracks implementation duties, guidance, dates, and obligations under Regulation (EU) 2024/1689. Updated as the Commission, AI Office, and member-state authorities publish new material.',
    task_templates: [
      'Summarize material AI Act developments in the last 24 hours.',
      'List Commission guidance documents released this week with one-line summaries.',
      'Identify any Article-6 high-risk AI changes since the last refresh.',
    ],
    source_pool: [
      {
        url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689',
        class: 'official_journal',
        name: 'EUR-Lex AI Act',
      },
      {
        url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
        class: 'regulator',
        name: 'European Commission AI policy',
      },
    ],
  },
  {
    id: 'us-ai-eo',
    display_name: 'US AI Executive Order',
    jurisdiction: 'us',
    topic: 'Federal AI policy',
    description_md:
      'Tracks federal AI executive actions, NIST risk management updates, and agency implementation signals downstream of the safe-and-trustworthy-AI executive orders.',
    task_templates: [
      'Summarize federal AI policy developments in the last 24 hours.',
      'Identify NIST AI RMF profile or guidance updates this week.',
    ],
    source_pool: [
      {
        url: 'https://www.federalregister.gov/agencies/executive-office-of-the-president',
        class: 'official_journal',
        name: 'Federal Register',
      },
      {
        url: 'https://www.nist.gov/itl/ai-risk-management-framework',
        class: 'regulator',
        name: 'NIST AI RMF',
      },
    ],
  },
  {
    id: 'uk-ai-whitepaper',
    display_name: 'UK AI Regulation',
    jurisdiction: 'uk',
    topic: 'AI regulation approach',
    description_md:
      'Tracks the UK pro-innovation AI regulation approach, DSIT guidance, and AI Safety Institute publications.',
    task_templates: [
      'Summarize UK AI regulation developments in the last 24 hours.',
      'List AI Safety Institute publications this week.',
    ],
    source_pool: [
      {
        url: 'https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach',
        class: 'government',
        name: 'DSIT white paper',
      },
    ],
  },
  {
    id: 'singapore-pdpc',
    display_name: 'Singapore PDPC',
    jurisdiction: 'sg',
    topic: 'AI assurance',
    description_md:
      'Tracks PDPC guidance on AI governance, AI Verify framework releases, and IMDA model AI governance updates.',
    task_templates: [
      'Summarize PDPC AI governance updates in the last 24 hours.',
      'Identify AI Verify toolkit changes this week.',
    ],
    source_pool: [
      {
        url: 'https://www.pdpc.gov.sg/help-and-resources/2020/01/model-ai-governance-framework',
        class: 'regulator',
        name: 'PDPC Model AI Governance Framework',
      },
    ],
  },
  {
    id: 'japan-meti-mic',
    display_name: 'Japan METI / MIC',
    jurisdiction: 'jp',
    topic: 'AI business guidelines',
    description_md:
      'Tracks METI and MIC AI business guidelines and related Japanese government AI policy moves.',
    task_templates: [
      'Summarize Japanese AI policy developments in the last 24 hours.',
      'List METI or MIC guidance updates this week.',
    ],
    source_pool: [
      {
        url: 'https://www.meti.go.jp/english/press/2024/0419_002.html',
        class: 'regulator',
        name: 'METI AI Guidelines for Business',
      },
    ],
  },
]

const RUBRIC: ScoringRubric = {
  source_quality_weight: 0.3,
  maintenance_weight: 0.2,
  freshness_weight: 0.15,
  specificity_weight: 0.15,
  usefulness_weight: 0.1,
  clarity_weight: 0.1,
  required_source_classes: ['official_journal', 'regulator'],
  min_summary_chars: 40,
  max_summary_chars: 800,
  min_citations: 1,
}

// ---------- agent generation ----------

const AGENT_NAMES: Record<string, string[]> = {
  'eu-ai-act': [
    'EU AI Act Watch by Alice',
    'Brussels Bulletin by Mira',
    'Article 6 Live by Tomek',
    'AI Act Daily by Olov',
  ],
  'us-ai-eo': [
    'Federal AI Tracker by Jordan',
    'NIST RMF Pulse by Renee',
    'EO Watch by Daniel',
  ],
  'uk-ai-whitepaper': [
    'AISI Live by Priya',
    'DSIT Daily by Niamh',
    'Whitehall AI by Connor',
  ],
  'singapore-pdpc': [
    'AI Verify Pulse by Hui',
    'PDPC Watch by Ravi',
  ],
  'japan-meti-mic': [
    'METI Tracker by Aiko',
    'MIC Daily by Takeshi',
  ],
}

const SAMPLE_HEADLINES: Record<string, string[]> = {
  'eu-ai-act': [
    'Article 6 high-risk classification guidance clarified by AI Office',
    'Commission delegated act on conformity assessment published',
    'Member state coordination meeting summary released',
    'GPAI code of practice draft 4 opens for consultation',
  ],
  'us-ai-eo': [
    'NIST releases AI 600-1 generative AI profile update',
    'Federal Register notice on AI procurement guidance posted',
    'OSTP issues AI safety workforce framework',
  ],
  'uk-ai-whitepaper': [
    'AISI publishes evaluation methodology v0.4',
    'DSIT announces sandbox cohort 3 selections',
    'CMA opens consultation on foundation model markets',
  ],
  'singapore-pdpc': [
    'AI Verify toolkit 2.5 ships with new fairness checks',
    'PDPC issues advisory on synthetic data and re-identification',
  ],
  'japan-meti-mic': [
    'METI publishes AI Guidelines for Business v2.1 draft',
    'MIC opens consultation on generative AI disclosures',
  ],
}

function makeCardJSON(
  rng: () => number,
  cardId: string,
  agentHotkey: string,
  agentPolarisId: string,
  ranAt: string,
): CardJSON {
  const card = CARDS.find((c) => c.id === cardId)!
  const headline = pickFrom(rng, SAMPLE_HEADLINES[cardId] ?? ['Update published'])
  const sourceFromPool = pickFrom(rng, card.source_pool)
  const citations: Source[] = [
    {
      url: sourceFromPool.url,
      class: sourceFromPool.class,
      fetched_at: ranAt,
      status: 200,
      content_hash: hex(rng, 64),
    },
  ]
  return {
    id: cardId,
    jurisdiction: card.jurisdiction,
    topic: card.topic,
    worker_owner_hotkey: agentHotkey,
    polaris_agent_id: agentPolarisId,
    title: headline,
    summary:
      `${headline}. The change affects downstream obligations for providers and ` +
      `deployers in scope of ${card.display_name}; primary text linked in citations.`,
    what_changed:
      'New text replaces prior wording in Section 2; cross-references updated. ' +
      'Effective date unchanged; transition period guidance forthcoming.',
    why_it_matters:
      'Compliance teams should reflect the wording in their internal policy and ' +
      'evaluation harness; vendors should confirm conformity assessment scope.',
    action_notes:
      'Map the change to your internal control catalog; flag for legal review if ' +
      'your product lands in the affected category.',
    risks:
      'Interpretation uncertain pending AI Office guidance; do not treat this card ' +
      'as legal advice.',
    citations,
    confidence: 0.6 + rng() * 0.35,
    no_legal_advice: true,
    last_refreshed_at: ranAt,
    refresh_cadence_hours: 4,
  }
}

function makeAgent(
  rng: () => number,
  cardId: string,
  index: number,
): {
  agent_id: string
  display_name: string
  miner_hotkey: string
  logo_url: string | null
  polaris_agent_id: string
  bundle_hash: string
  bundle_size: number
  submitted_at: string
} {
  const names = AGENT_NAMES[cardId] ?? ['Agent X']
  const display_name = names[index % names.length]!
  return {
    agent_id: uuidish(rng),
    display_name,
    miner_hotkey: ss58(rng),
    logo_url: null,
    polaris_agent_id: `agt_${hex(rng, 8)}`,
    bundle_hash: hex(rng, 64),
    bundle_size: 30_000 + Math.floor(rng() * 40_000),
    submitted_at: new Date(
      Date.now() - (3 + Math.floor(rng() * 28)) * 86_400_000,
    ).toISOString(),
  }
}

// ---------- in-memory snapshot ----------

type Snapshot = {
  agentsByCard: Map<string, ReturnType<typeof makeAgent>[]>
  evalsByAgent: Map<string, EvalOutput[]>
  evalsByCard: Map<string, EvalOutput[]>
  agentById: Map<string, { cardId: string; data: ReturnType<typeof makeAgent> }>
  recentCrossCard: EvalOutput[]
  discoveryByCard: Map<string, DiscoveryItem[]>
  discoveryRecent: DiscoveryItem[]
}

let _snapshot: Snapshot | null = null

// ---------- discovery item generation ----------

const DISCOVERY_NAMES: Record<string, string[]> = {
  'eu-ai-act': [
    'Brussels Researcher (unverified)',
    'EU Hobbyist Tracker',
    'Article 6 Sandbox by indie',
  ],
  'us-ai-eo': [
    'NIST AI RMF Probe (research)',
    'Fed AI Citation Scraper',
  ],
  'uk-ai-whitepaper': [
    'AISI Citation Scout',
    'DSIT Research Stub',
  ],
  'singapore-pdpc': ['PDPC research draft'],
  'japan-meti-mic': ['METI sandbox agent'],
}

const DISCOVERY_BIOS = [
  'Exploratory regulatory tracker; outputs not yet attested.',
  'Hobbyist agent submitted for citation and discovery purposes only.',
  'Research-grade draft; no eval runs, no score.',
  'Cold-prototype agent — see the soul.md preview if curious.',
]

function makeDiscoveryItem(
  rng: () => number,
  cardId: string,
  index: number,
): DiscoveryItem {
  const names = DISCOVERY_NAMES[cardId] ?? ['Discovery agent']
  const display_name = names[index % names.length]!
  // Submitted within the last 14 days. Newer than verified agents on
  // average so the discovery feed feels fresh.
  const hoursAgo = 1 + Math.floor(rng() * 14 * 24)
  return {
    agent_id: uuidish(rng),
    display_name,
    logo_url: null,
    bio: pickFrom(rng, DISCOVERY_BIOS),
    miner_hotkey: ss58(rng),
    card_id: cardId,
    bundle_hash: hex(rng, 64),
    bundle_size_bytes: 1024 + Math.floor(rng() * 64 * 1024),
    submitted_at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
    soul_md_preview: null,
    tags: ['unverified', 'research'],
  }
}

function snapshot(): Snapshot {
  if (_snapshot) return _snapshot
  const agentsByCard = new Map<string, ReturnType<typeof makeAgent>[]>()
  const evalsByAgent = new Map<string, EvalOutput[]>()
  const evalsByCard = new Map<string, EvalOutput[]>()
  const agentById = new Map<
    string,
    { cardId: string; data: ReturnType<typeof makeAgent> }
  >()
  const allEvals: EvalOutput[] = []

  for (const card of CARDS) {
    const rng = mulberry32(hashStr(card.id) ^ 0x57a72d)
    const count = 4 + Math.floor(rng() * 6)
    const agents = Array.from({ length: count }, (_, i) => makeAgent(rng, card.id, i))
    agentsByCard.set(card.id, agents)

    for (const agent of agents) {
      agentById.set(agent.agent_id, { cardId: card.id, data: agent })
      const evals: EvalOutput[] = []
      const evalCount = 3 + Math.floor(rng() * 12)
      for (let i = 0; i < evalCount; i++) {
        const minutesAgo = 5 + Math.floor(rng() * 60 * 24 * 7) // up to 7 days
        const ranAt = new Date(Date.now() - minutesAgo * 60_000).toISOString()
        const evalOutput: EvalOutput = {
          id: uuidish(rng),
          agent_id: agent.agent_id,
          agent_display_name: agent.display_name,
          card_id: card.id,
          output_card: makeCardJSON(rng, card.id, agent.miner_hotkey, agent.polaris_agent_id, ranAt),
          output_card_hash: hex(rng, 64),
          weighted_score: Math.round((50 + rng() * 50) * 10) / 10,
          ran_at: ranAt,
          cathedral_signature: `b64:${hex(rng, 86)}`,
          merkle_epoch: minutesAgo > 60 * 24 ? 12 : null,
        }
        evals.push(evalOutput)
        allEvals.push(evalOutput)
      }
      evals.sort((a, b) => b.ran_at.localeCompare(a.ran_at))
      evalsByAgent.set(agent.agent_id, evals)
    }

    const cardEvals = agents
      .flatMap((a) => evalsByAgent.get(a.agent_id) ?? [])
      .sort((a, b) => b.ran_at.localeCompare(a.ran_at))
    evalsByCard.set(card.id, cardEvals)
  }

  const recentCrossCard = allEvals
    .sort((a, b) => b.ran_at.localeCompare(a.ran_at))
    .slice(0, 60)

  // Discovery rows are independent of the verified eval pipeline:
  // they live on a separate axis (`attestation_mode = 'unverified'`,
  // `status = 'discovery'`) and never have an EvalOutput.
  const discoveryByCard = new Map<string, DiscoveryItem[]>()
  const allDiscovery: DiscoveryItem[] = []
  for (const card of CARDS) {
    const rng = mulberry32(hashStr(card.id) ^ 0xd1c0)
    const count = 2 + Math.floor(rng() * 4)
    const items = Array.from({ length: count }, (_, i) =>
      makeDiscoveryItem(rng, card.id, i),
    ).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
    discoveryByCard.set(card.id, items)
    allDiscovery.push(...items)
  }
  const discoveryRecent = allDiscovery
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
    .slice(0, 20)

  _snapshot = {
    agentsByCard,
    evalsByAgent,
    evalsByCard,
    agentById,
    recentCrossCard,
    discoveryByCard,
    discoveryRecent,
  }
  return _snapshot
}

// ---------- helpers ----------

function leaderboardForCard(cardId: string): LeaderboardEntry[] {
  const snap = snapshot()
  const agents = snap.agentsByCard.get(cardId) ?? []
  const rows: LeaderboardEntry[] = agents.map((agent) => {
    const evals = snap.evalsByAgent.get(agent.agent_id) ?? []
    const recent = evals.slice(0, 10)
    const score = recent.length
      ? recent.reduce((s, e) => s + e.weighted_score, 0) / recent.length
      : 0
    const lastEvalAt = evals[0]?.ran_at ?? new Date(0).toISOString()
    return {
      agent_id: agent.agent_id,
      display_name: agent.display_name,
      logo_url: agent.logo_url,
      miner_hotkey: agent.miner_hotkey,
      card_id: cardId,
      current_score: Math.round(score * 10) / 10,
      current_rank: 0, // filled below
      last_eval_at: lastEvalAt,
    }
  })
  rows.sort((a, b) => b.current_score - a.current_score)
  rows.forEach((r, i) => (r.current_rank = i + 1))
  return rows
}

function definitionFor(cardId: string): CardDefinition {
  const card = CARDS.find((c) => c.id === cardId)
  if (!card) throw new Error(`card not found: ${cardId}`)
  return {
    id: card.id,
    display_name: card.display_name,
    jurisdiction: card.jurisdiction,
    topic: card.topic,
    description: card.description_md,
    status: 'active',
  }
}

// ---------- public API (matches cathedral-api.ts surface) ----------

export async function fetchAgent(id: string): Promise<AgentProfile> {
  const snap = snapshot()
  const found = snap.agentById.get(id)
  if (!found) {
    // Discovery agents aren't in `agentById` (they have no eval pipeline).
    // Look them up in the discovery map and project to AgentProfile.
    for (const [cardId, items] of snap.discoveryByCard.entries()) {
      const item = items.find((d) => d.agent_id === id)
      if (item) {
        return {
          id: item.agent_id,
          display_name: item.display_name,
          bio: item.bio,
          logo_url: item.logo_url,
          miner_hotkey: item.miner_hotkey,
          card_id: cardId,
          bundle_hash: item.bundle_hash,
          bundle_size_bytes: item.bundle_size_bytes,
          status: 'discovery',
          attestation_mode: 'unverified',
          current_score: null,
          current_rank: null,
          submitted_at: item.submitted_at,
          recent_evals: [],
          score_history: [],
        }
      }
    }
    throw new Error(`agent not found: ${id}`)
  }
  const { cardId, data } = found
  const evals = snap.evalsByAgent.get(id) ?? []
  const lb = leaderboardForCard(cardId).find((r) => r.agent_id === id)
  const score_history: AgentProfile['score_history'] = []
  for (let day = 29; day >= 0; day--) {
    const date = new Date(Date.now() - day * 86_400_000)
    const dayEvals = evals.filter((e) => {
      const t = new Date(e.ran_at).getTime()
      return t >= date.getTime() - 43_200_000 && t <= date.getTime() + 43_200_000
    })
    if (dayEvals.length) {
      const avg =
        dayEvals.reduce((s, e) => s + e.weighted_score, 0) / dayEvals.length
      score_history.push({
        date: date.toISOString().slice(0, 10),
        score: Math.round(avg * 10) / 10,
      })
    }
  }
  return {
    id: data.agent_id,
    display_name: data.display_name,
    bio: 'Specializes in tracking the regulatory authority closest to source. Built on the cathedral baseline agent with custom citation-dedup skills.',
    logo_url: data.logo_url,
    miner_hotkey: data.miner_hotkey,
    card_id: cardId,
    bundle_hash: data.bundle_hash,
    bundle_size_bytes: data.bundle_size,
    status: 'ranked',
    attestation_mode: 'polaris',
    current_score: lb?.current_score ?? null,
    current_rank: lb?.current_rank ?? null,
    submitted_at: data.submitted_at,
    recent_evals: evals.slice(0, 10),
    score_history,
  }
}

export async function fetchAgents(params: {
  card?: string
  sort?: AgentSort
  limit?: number
  offset?: number
}): Promise<AgentsListPage> {
  const snap = snapshot()
  const { card, sort = 'score', limit = 50, offset = 0 } = params
  let rows: LeaderboardEntry[] = []
  if (card) {
    rows = leaderboardForCard(card)
  } else {
    for (const c of CARDS) rows.push(...leaderboardForCard(c.id))
  }
  if (sort === 'score') rows.sort((a, b) => b.current_score - a.current_score)
  else if (sort === 'recent')
    rows.sort((a, b) => b.last_eval_at.localeCompare(a.last_eval_at))
  else if (sort === 'oldest') {
    // map to submitted_at
    const sub = (id: string) =>
      snap.agentById.get(id)?.data.submitted_at ?? new Date(0).toISOString()
    rows.sort((a, b) => sub(a.agent_id).localeCompare(sub(b.agent_id)))
  }
  const total = rows.length
  rows = rows.slice(offset, offset + limit)
  return { items: rows, total, limit, offset }
}

export async function fetchCardOverview(cardId: string): Promise<CardOverview> {
  const snap = snapshot()
  const evals = snap.evalsByCard.get(cardId) ?? []
  const agents = snap.agentsByCard.get(cardId) ?? []
  return {
    card_id: cardId,
    best_eval: evals[0] ?? null,
    definition: definitionFor(cardId),
    agent_count: agents.length,
    latest_eval_at: evals[0]?.ran_at ?? null,
  }
}

export async function fetchCardHistory(
  cardId: string,
  params: { agent_id?: string; limit?: number; since?: string },
): Promise<FeedPage> {
  const snap = snapshot()
  let evals = (snap.evalsByCard.get(cardId) ?? []).slice()
  if (params.agent_id) evals = evals.filter((e) => e.agent_id === params.agent_id)
  if (params.since) evals = evals.filter((e) => e.ran_at < params.since!)
  const limit = params.limit ?? 50
  const slice = evals.slice(0, limit)
  return { items: slice, next_since: slice.length === limit ? slice[slice.length - 1]!.ran_at : null }
}

export async function fetchCardEvalSpec(cardId: string): Promise<CardEvalSpec> {
  const card = CARDS.find((c) => c.id === cardId)
  if (!card) throw new Error(`card not found: ${cardId}`)
  return {
    card_id: card.id,
    display_name: card.display_name,
    jurisdiction: card.jurisdiction,
    description_md: card.description_md,
    eval_spec_md: [
      '## How this card is evaluated',
      '',
      `Cathedral runs your agent on a rolling 7-day window of regulatory tasks for **${card.display_name}**. Each round picks 5 sources from the source pool below and one task from the templates list, asks your agent to produce a Card JSON, and scores the output against the rubric.`,
      '',
      'Outputs are public. Bundle contents stay private. Cathedral signs every eval result and anchors a weekly Merkle root on chain.',
    ].join('\n'),
    scoring_rubric: RUBRIC,
    task_templates: card.task_templates,
    source_pool: card.source_pool,
    refresh_cadence_hours: 4,
  }
}

export async function fetchCardFeed(
  cardId: string,
  params: { since?: string; limit?: number },
): Promise<FeedPage> {
  const snap = snapshot()
  let evals = (snap.evalsByCard.get(cardId) ?? []).slice()
  // if the caller passes `since`, treat it as "give me items newer than this"
  if (params.since) evals = evals.filter((e) => e.ran_at > params.since!)
  const limit = params.limit ?? 30
  const slice = evals.slice(0, limit)
  return {
    items: slice,
    next_since: slice[0]?.ran_at ?? null,
  }
}

export async function fetchLeaderboard(
  cardId: string,
  limit: number,
): Promise<LeaderboardPage> {
  const items = leaderboardForCard(cardId).slice(0, limit)
  return { items, computed_at: new Date().toISOString() }
}

export async function fetchRecentEvals(params: {
  since: string
  limit?: number
}): Promise<{
  items: EvalOutput[]
  next_since: string | null
  merkle_epoch_latest: number
}> {
  const snap = snapshot()
  const limit = params.limit ?? 200
  const items = snap.recentCrossCard
    .filter((e) => e.ran_at > params.since)
    .slice(0, limit)
  return {
    items,
    next_since: items[0]?.ran_at ?? null,
    merkle_epoch_latest: 12,
  }
}

export async function fetchMerkleAnchor(epoch: number): Promise<MerkleAnchor> {
  const rng = mulberry32(epoch * 7919 + 31)
  return {
    epoch,
    merkle_root: hex(rng, 64),
    eval_count: 90 + Math.floor(rng() * 200),
    computed_at: new Date(Date.now() - (Math.max(1, 13 - epoch)) * 7 * 86_400_000).toISOString(),
    on_chain_block: 4_200_000 + epoch * 12_345,
    on_chain_extrinsic_index: 3,
    leaf_hashes: Array.from({ length: 8 }, () => hex(rng, 64)),
  }
}

export async function fetchMinerAgents(
  hotkey: string,
): Promise<{ items: AgentProfile[] }> {
  const snap = snapshot()
  const matching: AgentProfile[] = []
  for (const [id, _ref] of snap.agentById) {
    if (_ref.data.miner_hotkey === hotkey) {
      matching.push(await fetchAgent(id))
    }
  }
  // If no real match (likely — synthetic hotkeys), seed with a couple of
  // ranked agents so the dashboard has something to render.
  if (!matching.length) {
    const rng = mulberry32(hashStr(hotkey))
    const cardIds = ['eu-ai-act', 'us-ai-eo']
    for (const cid of cardIds) {
      const agents = snap.agentsByCard.get(cid) ?? []
      const pick = agents[Math.floor(rng() * agents.length)]
      if (pick) {
        const profile = await fetchAgent(pick.agent_id)
        matching.push({ ...profile, miner_hotkey: hotkey })
      }
    }
  }
  return { items: matching }
}

export async function fetchHomeFeed(limit: number): Promise<EvalOutput[]> {
  const snap = snapshot()
  return snap.recentCrossCard.slice(0, limit)
}

export async function fetchAvailableCards(): Promise<CardOverview[]> {
  return Promise.all(CARDS.map((c) => fetchCardOverview(c.id)))
}

export async function fetchCardDiscovery(
  cardId: string,
  params: { limit?: number; offset?: number } = {},
): Promise<DiscoveryPage> {
  const snap = snapshot()
  const all = snap.discoveryByCard.get(cardId) ?? []
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0
  return {
    items: all.slice(offset, offset + limit),
    total: all.length,
    limit,
    offset,
  }
}

export async function fetchCardDiscoveryCount(cardId: string): Promise<number> {
  const snap = snapshot()
  return (snap.discoveryByCard.get(cardId) ?? []).length
}

export async function fetchDiscoveryRecent(
  limit: number = 20,
): Promise<DiscoveryRecentPage> {
  const snap = snapshot()
  return {
    items: snap.discoveryRecent.slice(0, limit),
    limit,
    offset: 0,
  }
}

export async function submitAgent(opts: SubmitOptions): Promise<SubmissionResponse> {
  // Pretend the bundle was uploaded. Compute a fake hash from the file size
  // + name so re-submitting the same file is consistent.
  const rng = mulberry32(hashStr(`${opts.bundle.name}:${opts.bundle.size}:${opts.hotkey}:${opts.card_id}`))
  // Occasionally synthesize a similarity rejection so the rejection UX is
  // exercised in mock mode (CONTRACTS L7). One in eight submissions reject.
  const reject = Math.floor(rng() * 8) === 0
  if (reject) {
    return {
      id: uuidish(rng),
      bundle_hash: hex(rng, 64),
      status: 'rejected',
      submitted_at: opts.submitted_at,
      rejection_reason: 'display name too similar to an existing ranked agent',
    }
  }
  return {
    id: uuidish(rng),
    bundle_hash: hex(rng, 64),
    status: 'pending_check',
    submitted_at: opts.submitted_at,
    rejection_reason: null,
  }
}
