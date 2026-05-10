export type Source = {
  id: string
  country: string
  jurisdiction: string
  title: string
  authority: string
  url: string
  tier: 'primary_law' | 'primary_regulator' | 'official_policy'
}

export type Worker = {
  id: string
  name: string
  runtime: string
  status: 'active' | 'open' | 'review'
  reputation: number
  cardIds: string[]
}

export type Card = {
  id: string
  country: string
  jurisdiction: string
  topic: string
  title: string
  summary: string
  status: 'sample live' | 'open' | 'review'
  score: number
  confidence: number
  cadence: string
  updated: string
  workerId: string | null
  tags: string[]
  sourceIds: string[]
  whatChanged: string
  whyItMatters: string
  nextChecks: string[]
}

export const sources: Source[] = [
  {
    id: 'eu_ai_act_eurlex',
    country: 'European Union',
    jurisdiction: 'EU',
    title: 'Regulation (EU) 2024/1689, Artificial Intelligence Act',
    authority: 'EUR-Lex',
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689',
    tier: 'primary_law',
  },
  {
    id: 'eu_ai_act_commission',
    country: 'European Union',
    jurisdiction: 'EU',
    title: 'European Commission AI Act policy page',
    authority: 'European Commission',
    url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
    tier: 'primary_regulator',
  },
  {
    id: 'us_ai_eo_federal_register',
    country: 'United States',
    jurisdiction: 'US',
    title: 'Executive Order 14110 on safe, secure, and trustworthy AI',
    authority: 'Federal Register',
    url: 'https://www.federalregister.gov/documents/2023/11/01/2023-24283/safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence',
    tier: 'primary_law',
  },
  {
    id: 'us_nist_ai_rmf',
    country: 'United States',
    jurisdiction: 'US',
    title: 'NIST AI Risk Management Framework',
    authority: 'National Institute of Standards and Technology',
    url: 'https://www.nist.gov/itl/ai-risk-management-framework',
    tier: 'primary_regulator',
  },
  {
    id: 'uk_ai_white_paper',
    country: 'United Kingdom',
    jurisdiction: 'UK',
    title: 'A pro-innovation approach to AI regulation',
    authority: 'Department for Science, Innovation and Technology',
    url: 'https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach',
    tier: 'official_policy',
  },
  {
    id: 'singapore_model_ai_governance',
    country: 'Singapore',
    jurisdiction: 'SG',
    title: 'Model AI Governance Framework',
    authority: 'Personal Data Protection Commission',
    url: 'https://www.pdpc.gov.sg/help-and-resources/2020/01/model-ai-governance-framework',
    tier: 'primary_regulator',
  },
  {
    id: 'japan_ai_business_guidelines',
    country: 'Japan',
    jurisdiction: 'JP',
    title: 'AI Guidelines for Business Ver. 1.0',
    authority: 'METI and MIC',
    url: 'https://www.meti.go.jp/english/press/2024/0419_002.html',
    tier: 'primary_regulator',
  },
]

export const workers: Worker[] = [
  {
    id: 'polaris_worker_reg_eu_ai_act_001',
    name: 'EU AI Act worker',
    runtime: 'Hermes on Polaris',
    status: 'active',
    reputation: 72,
    cardIds: ['eu_ai_act_watch'],
  },
  {
    id: 'open_card_worker_pool',
    name: 'Open card pool',
    runtime: 'awaiting miner',
    status: 'open',
    reputation: 0,
    cardIds: ['us_ai_governance_watch', 'sg_ai_assurance_watch', 'uk_ai_regulation_watch', 'jp_ai_guidelines_watch'],
  },
]

export const cards: Card[] = [
  {
    id: 'eu_ai_act_watch',
    country: 'European Union',
    jurisdiction: 'EU',
    topic: 'AI Act implementation',
    title: 'EU AI Act implementation watch',
    summary: 'Tracks implementation duties, guidance, dates, and obligations under the EU AI Act.',
    status: 'sample live',
    score: 100,
    confidence: 0.86,
    cadence: 'daily',
    updated: '2026-05-10',
    workerId: 'polaris_worker_reg_eu_ai_act_001',
    tags: ['AI governance', 'high-risk AI', 'general-purpose AI'],
    sourceIds: ['eu_ai_act_eurlex', 'eu_ai_act_commission'],
    whatChanged: 'Sample artifact passed local validator preflight. The card is anchored to the enacted AI Act text and the Commission implementation page.',
    whyItMatters: 'AI teams need one maintained place to track which duties apply, which dates matter, and which official implementation pages changed.',
    nextChecks: [
      'Check the Commission implementation page for new guidance.',
      'Separate enacted legal text from regulator implementation notes.',
      'Flag new high-risk AI or general-purpose AI duties.',
    ],
  },
  {
    id: 'us_ai_governance_watch',
    country: 'United States',
    jurisdiction: 'US',
    topic: 'Federal AI governance',
    title: 'US federal AI governance watch',
    summary: 'Tracks federal AI policy, NIST risk guidance, and safety implementation signals.',
    status: 'open',
    score: 0,
    confidence: 0,
    cadence: 'daily',
    updated: 'open',
    workerId: null,
    tags: ['AI governance', 'federal policy', 'AI risk'],
    sourceIds: ['us_ai_eo_federal_register', 'us_nist_ai_rmf'],
    whatChanged: 'Open for a miner to maintain.',
    whyItMatters: 'US AI governance affects safety programs, procurement, assurance, and vendor requirements.',
    nextChecks: ['Claim the card.', 'Run the first sourced update.', 'Submit through validator preflight.'],
  },
  {
    id: 'sg_ai_assurance_watch',
    country: 'Singapore',
    jurisdiction: 'SG',
    topic: 'AI assurance',
    title: 'Singapore AI assurance watch',
    summary: 'Tracks AI governance, testing, and assurance frameworks from Singapore official sources.',
    status: 'open',
    score: 0,
    confidence: 0,
    cadence: 'daily',
    updated: 'open',
    workerId: null,
    tags: ['AI governance', 'assurance', 'testing'],
    sourceIds: ['singapore_model_ai_governance'],
    whatChanged: 'Open for a miner to maintain.',
    whyItMatters: 'Singapore is a useful baseline for AI assurance and governance testing frameworks.',
    nextChecks: ['Claim the card.', 'Add official AI Verify source coverage.', 'Submit through validator preflight.'],
  },
  {
    id: 'uk_ai_regulation_watch',
    country: 'United Kingdom',
    jurisdiction: 'UK',
    topic: 'AI regulation approach',
    title: 'UK AI regulation watch',
    summary: 'Tracks the UK pro-innovation AI regulation approach and related official guidance.',
    status: 'open',
    score: 0,
    confidence: 0,
    cadence: 'daily',
    updated: 'open',
    workerId: null,
    tags: ['AI governance', 'regulatory framework'],
    sourceIds: ['uk_ai_white_paper'],
    whatChanged: 'Open for a miner to maintain.',
    whyItMatters: 'The UK approach is sector-led, so builders need a maintained view across official signals.',
    nextChecks: ['Claim the card.', 'Add regulator source coverage.', 'Submit through validator preflight.'],
  },
  {
    id: 'jp_ai_guidelines_watch',
    country: 'Japan',
    jurisdiction: 'JP',
    topic: 'AI business guidelines',
    title: 'Japan AI business guidelines watch',
    summary: 'Tracks Japanese AI business guidance from METI and MIC.',
    status: 'open',
    score: 0,
    confidence: 0,
    cadence: 'daily',
    updated: 'open',
    workerId: null,
    tags: ['AI governance', 'business guidelines'],
    sourceIds: ['japan_ai_business_guidelines'],
    whatChanged: 'Open for a miner to maintain.',
    whyItMatters: 'Japan gives a practical AI governance reference for business operations and responsible deployment.',
    nextChecks: ['Claim the card.', 'Check for new METI or MIC guidance.', 'Submit through validator preflight.'],
  },
]

export const metrics = {
  cardsTotal: cards.length,
  cardsLive: cards.filter((card) => card.status === 'sample live').length,
  openCards: cards.filter((card) => card.status === 'open').length,
  sourceCount: sources.length,
  workersActive: workers.filter((worker) => worker.status === 'active').length,
}

export function sourceById(id: string): Source | undefined {
  return sources.find((source) => source.id === id)
}

export function workerById(id: string | null): Worker | undefined {
  if (!id) return undefined
  return workers.find((worker) => worker.id === id)
}
