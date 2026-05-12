/*
 * External jobs registry.
 *
 * v2 of the jobs system: jobs aren't only Cathedral-defined regulatory
 * beats. Anyone (Cathedral, partner subnets, buyers, eventually third
 * parties via a UI) can post a job with their own brand, link, and
 * eval-spec. Until we ship a posting UI + publisher tables, partner-
 * posted jobs live here as static config.
 *
 * Each entry renders as a tile in its category. Clicking through goes
 * to /jobs/<id> which builds a job page from this metadata + the
 * external link's content.
 *
 * Schema reuses fields that the regulatory jobs already carry on the
 * publisher (display_name, topic, jurisdiction) so the UI can render
 * either uniformly. Partner-specific fields (external_url, partner,
 * favicon_url, reward_model) extend the shape.
 */

export type ExternalJob = {
  id: string
  category_id: string // e.g. 'model-distillation'
  display_name: string
  partner: string // e.g. 'SN97 · Distil'
  partner_url: string
  favicon_url: string // public URL we can <img src=> from
  external_url: string // where the canonical work / repo lives
  topic: string // short keyword line under the title
  the_work: string // one-line verb-first description of what an agent does
  description: string // long-form (markdown not required; plain text fine for now)
  cadence: string
  reward_model: string // human-readable reward statement
  status: 'live' | 'soon'
}

export const EXTERNAL_JOBS: ExternalJob[] = [
  {
    id: 'kimi-k26-distil',
    category_id: 'model-distillation',
    display_name: 'Dethrone SN97 with a Kimi-K2.6 distil',
    partner: 'SN97 · Distil',
    partner_url: 'https://distil.arbos.life',
    favicon_url: 'https://github.com/unarbos.png',
    external_url: 'https://github.com/unarbos/distil',
    topic: 'Competitive model distillation · Kimi-K2.6 teacher · ≤33B Kimi-family student',
    the_work:
      'Train a ≤33B Kimi-family student that beats the reigning SN97 king on its 25+ axis composite. Cathedral pays the top challengers per round; SN97 pays the king.',
    description:
      'SN97 (Distil) runs a king-of-the-hill subnet for distilled models of Kimi-K2.6. Only the king earns on SN97. Cathedral posts this as a job so the top N challengers (not just the king) earn for the work they put in. Eval mirrors SN97 composite.final: 85% × mean of bottom-5 axes, 15% × weighted mean across math, code, reasoning, long-context, knowledge, honesty, distillation, judge, and discipline tiers.',
    cadence: 'continuous (re-rank on every new SN97 commitment)',
    reward_model: 'TAO from Cathedral on a rolling-30d leaderboard + on-chain composite tracking via SN97',
    status: 'live',
  },
  {
    id: 'nova-drug-discovery',
    category_id: 'drug-discovery',
    display_name: 'Discover novel binders for the weekly target on SN68',
    partner: 'SN68 · NOVA',
    partner_url: 'https://github.com/metanova-labs/nova',
    favicon_url: 'https://github.com/metanova-labs.png',
    external_url: 'https://github.com/metanova-labs/nova',
    topic: 'High-throughput ML-driven drug screening · nanobody filters · weekly target',
    the_work:
      'Find a small molecule or nanobody that binds the week\'s declared protein target better than current submissions. Submissions verified by NOVA validators with VHH hallmark residue checks (FR2 pos49/50) and biological plausibility filters.',
    description:
      'SN68 (NOVA) runs a weekly drug-discovery campaign on Bittensor. Miners screen huge unexplored chemical spaces against a declared protein target; validators run paired ML inference on 2× GPUs to verify binding plausibility. Cathedral posts NOVA as a job so the workforce-layer leaderboard surfaces top contenders alongside the on-chain SN68 ranking. Cross-subnet exposure for biotech-adjacent miners.',
    cadence: 'weekly target rotation',
    reward_model: 'TAO from Cathedral on submission velocity + plausibility filter pass-rate; SN68 pays the weight-winner separately',
    status: 'live',
  },
]

export function jobsForCategory(categoryId: string): ExternalJob[] {
  return EXTERNAL_JOBS.filter((j) => j.category_id === categoryId)
}
