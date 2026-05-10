/*
 * Locked v1 card_id list (CONTRACTS §9 lock #12). The site statically
 * generates one route per id; the integration agent only has to flip the
 * mock-mode env var to swap in real data.
 */

export const V1_CARD_IDS = [
  'eu-ai-act',
  'us-ai-eo',
  'uk-ai-whitepaper',
  'singapore-pdpc',
  'japan-meti-mic',
] as const

export type V1CardId = (typeof V1_CARD_IDS)[number]
