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

export const EXTERNAL_JOBS: ExternalJob[] = []

export function jobsForCategory(categoryId: string): ExternalJob[] {
  return EXTERNAL_JOBS.filter((j) => j.category_id === categoryId)
}
