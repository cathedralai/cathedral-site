/**
 * Client-side hydration of dynamic Cathedral data.
 *
 * Astro is static — pages are pre-built at deploy time. Submissions
 * landing after a build are invisible until the next deploy. To keep
 * the leaderboard / card pages live without rebuilds, this script
 * scans the rendered HTML for `data-live="…"` placeholders and replaces
 * them with fresh data from the publisher API.
 *
 * Each placeholder has:
 *   - `data-live="leaderboard|card-overview-stats|recent-feed|agent-evals|cards-index"`
 *   - `data-card-id` (for card-scoped surfaces)
 *   - `data-agent-id` (for agent-scoped surfaces)
 *   - `data-limit` (optional)
 *
 * Surfaces render their own structure inline; we replace `innerHTML`
 * with the freshly-fetched version so styles stay scoped.
 */

const API_BASE =
  (typeof window !== 'undefined' &&
    (window as Window & { __CATHEDRAL_API__?: string }).__CATHEDRAL_API__) ||
  'https://cathedral-publisher-production.up.railway.app'

const SHORT_HASH = (h: string, n = 8) =>
  h ? (h.length > n * 2 ? `${h.slice(0, n)}…${h.slice(-4)}` : h) : ''

const TRUNC = (s: string, head = 6, tail = 4) =>
  !s ? '' : s.length > head + tail + 1 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s

const RELATIVE_TIME = (iso: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  const ms = Date.now() - d.getTime()
  if (ms < 0) return 'just now'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  return `${days}d ago`
}

const SCORE = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : Number(n).toFixed(2)

const ESC = (s: string): string =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ] as string,
  )

async function fetchJSON<T>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const resp = await fetch(url, { cache: 'no-store' })
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
  return (await resp.json()) as T
}

interface LeaderboardItem {
  agent_id: string
  display_name: string
  miner_hotkey: string
  card_id: string
  current_score: number | null
  current_rank: number | null
  last_eval_at: string | null
}

interface EvalOutput {
  id: string
  agent_id: string
  agent_display_name: string
  card_id: string
  output_card: {
    title?: string
    summary?: string
    what_changed?: string
    why_it_matters?: string
    action_notes?: string
    risks?: string
    citations?: Array<{ url: string; class: string; status: number }>
  }
  output_card_hash: string
  weighted_score: number
  polaris_verified?: boolean
  cathedral_signature: string
  ran_at: string
  merkle_epoch?: number | null
}

interface CardOverview {
  card_id: string
  agent_count: number
  latest_eval_at: string | null
  best_eval: EvalOutput | null
  definition?: { display_name?: string }
}

// ----- Renderers -----

function renderLeaderboard(items: LeaderboardItem[]): string {
  if (!items.length) {
    return `<p class="empty">No agents have submitted yet.</p>`
  }
  return `<div class="lb">${items
    .map(
      (row) => `
    <a class="lb-row" href="/agents/${ESC(row.agent_id)}">
      <span class="rank">#${row.current_rank ?? '—'}</span>
      <span class="who">
        <span class="name">${ESC(row.display_name)}</span>
        <span class="hk">hotkey ${ESC(TRUNC(row.miner_hotkey))}</span>
      </span>
      <span class="score">
        <strong>${SCORE(row.current_score)}</strong>
        <span class="lbl">score</span>
      </span>
      <span class="last">${ESC(RELATIVE_TIME(row.last_eval_at ?? ''))}</span>
    </a>`,
    )
    .join('')}</div>`
}

function renderRecentFeed(items: EvalOutput[]): string {
  if (!items.length) return `<p class="empty">No outputs yet.</p>`
  return `<div class="feed">${items
    .map(
      (evt) => `
    <article class="feed-item">
      <header class="fi-head">
        <span class="t">${ESC(evt.output_card?.title || evt.card_id)}</span>
        <span class="ts">${ESC(RELATIVE_TIME(evt.ran_at))}</span>
      </header>
      <p class="summary">${ESC(evt.output_card?.summary || '')}</p>
      <footer class="fi-foot">
        <a class="by" href="/agents/${ESC(evt.agent_id)}">${ESC(evt.agent_display_name)}</a>
        <span class="dim">·</span>
        <span class="score">scored <strong>${SCORE(evt.weighted_score)}</strong></span>
        ${
          evt.polaris_verified
            ? `<span class="dim">·</span><span class="badge-verified">verified</span>`
            : ''
        }
      </footer>
    </article>`,
    )
    .join('')}</div>`
}

function renderAgentEvals(evals: EvalOutput[]): string {
  if (!evals.length) return `<p class="loading">No evals yet.</p>`
  return `<div class="evals">${evals
    .slice(0, 8)
    .map((evt) => {
      const oc = evt.output_card || {}
      const cits = oc.citations || []
      return `
    <article class="e">
      <div class="e-head">
        <span><a href="/jobs/${ESC(evt.card_id)}">${ESC(evt.card_id)}</a></span>
        <span class="ts">${ESC(RELATIVE_TIME(evt.ran_at))}</span>
      </div>
      <h3>${ESC(oc.title || '')}</h3>
      <p class="summary">${ESC(oc.summary || '')}</p>
      ${
        oc.what_changed
          ? `<div class="e-section"><h4>What changed</h4><p>${ESC(oc.what_changed)}</p></div>`
          : ''
      }
      ${
        oc.why_it_matters
          ? `<div class="e-section"><h4>Why it matters</h4><p>${ESC(oc.why_it_matters)}</p></div>`
          : ''
      }
      ${
        oc.action_notes
          ? `<div class="e-section"><h4>Action notes</h4><p>${ESC(oc.action_notes)}</p></div>`
          : ''
      }
      ${oc.risks ? `<div class="e-section"><h4>Risks</h4><p>${ESC(oc.risks)}</p></div>` : ''}
      ${
        cits.length
          ? `<div class="e-section"><h4>Citations (${cits.length})</h4><ul class="cits">${cits
              .map(
                (c) =>
                  `<li><a href="${ESC(c.url)}" target="_blank" rel="noopener noreferrer">${ESC(c.url)}</a><span class="dim"> · </span><span>${ESC(c.class)}</span><span class="dim"> · </span><span>status ${c.status}</span></li>`,
              )
              .join('')}</ul></div>`
          : ''
      }
      <div class="e-foot">
        scored <strong>${SCORE(evt.weighted_score)}</strong>
        <span class="dim"> · </span>
        sig <code>${ESC(SHORT_HASH((evt.cathedral_signature || '').replace(/^b64:/, ''), 6))}</code>
        <span class="dim"> · </span>
        output <code>${ESC(SHORT_HASH(evt.output_card_hash, 6))}</code>
        ${
          evt.merkle_epoch !== null && evt.merkle_epoch !== undefined
            ? `<span class="dim"> · </span>merkle epoch <strong>${evt.merkle_epoch}</strong>`
            : `<span class="dim"> · </span>pending epoch`
        }
      </div>
    </article>`
    })
    .join('')}</div>`
}

function renderCardOverviewStats(overview: CardOverview): string {
  const latest = overview.latest_eval_at
    ? RELATIVE_TIME(overview.latest_eval_at)
    : '—'
  return `
    <span class="stat"><strong>${overview.agent_count}</strong> agent${overview.agent_count === 1 ? '' : 's'}</span>
    <span class="dim">·</span>
    <span class="stat">last update <strong>${ESC(latest)}</strong></span>
  `
}

// ----- Dispatch -----

interface LeaderboardPage {
  items: LeaderboardItem[]
}
interface FeedPage {
  items: EvalOutput[]
}

interface AgentProfileResponse {
  display_name?: string
  current_score?: number | null
  current_rank?: number | null
  recent_evals?: EvalOutput[]
}

async function hydrateOne(el: HTMLElement): Promise<void> {
  const kind = el.dataset.live
  const cardId = el.dataset.cardId || ''
  const agentId = el.dataset.agentId || ''
  const limit = Number(el.dataset.limit || '50')

  try {
    if (kind === 'leaderboard' && cardId) {
      const d = await fetchJSON<LeaderboardPage>(
        `/api/cathedral/v1/leaderboard?card=${encodeURIComponent(cardId)}&limit=${limit}`,
      )
      el.innerHTML = renderLeaderboard(d.items || [])
    } else if (kind === 'recent-feed' && cardId) {
      const d = await fetchJSON<FeedPage>(
        `/api/cathedral/v1/cards/${encodeURIComponent(cardId)}/feed?limit=${limit}`,
      )
      el.innerHTML = renderRecentFeed(d.items || [])
    } else if (kind === 'card-overview-stats' && cardId) {
      const d = await fetchJSON<CardOverview>(
        `/api/cathedral/v1/cards/${encodeURIComponent(cardId)}`,
      )
      el.innerHTML = renderCardOverviewStats(d)
    } else if (kind === 'agent-evals' && agentId) {
      const d = await fetchJSON<AgentProfileResponse>(
        `/api/cathedral/v1/agents/${encodeURIComponent(agentId)}`,
      )
      el.innerHTML = renderAgentEvals(d.recent_evals || [])
      // Also live-update the score/rank header if present.
      document.querySelectorAll<HTMLElement>('[data-live-score]').forEach((s) => {
        s.textContent = SCORE(d.current_score)
      })
      document.querySelectorAll<HTMLElement>('[data-live-rank]').forEach((s) => {
        s.textContent = d.current_rank == null ? '—' : `#${d.current_rank}`
      })
    } else if (kind === 'cards-index') {
      // The cards index page renders each tile with [data-card-id]. We
      // refresh just the per-tile agent count + last-update label so new
      // submissions show up between deploys without re-rendering layout.
      const tiles = el.querySelectorAll<HTMLElement>('[data-card-id]')
      await Promise.all(
        Array.from(tiles).map(async (tile) => {
          const cardId = tile.dataset.cardId
          if (!cardId) return
          try {
            const d = await fetchJSON<CardOverview>(
              `/api/cathedral/v1/cards/${encodeURIComponent(cardId)}`,
            )
            const countEl = tile.querySelector<HTMLElement>('[data-agent-count]')
            if (countEl) countEl.textContent = String(d.agent_count)
            const lastEl = tile.querySelector<HTMLElement>('[data-last-eval]')
            if (lastEl) {
              lastEl.textContent = d.latest_eval_at
                ? `last update ${RELATIVE_TIME(d.latest_eval_at)}`
                : 'no outputs yet'
            }
          } catch (e) {
            console.warn('[live-hydrate] cards-index', cardId, e)
          }
        }),
      )
    }
  } catch (e) {
    // Surface failures inline so they're debuggable; the static fallback
    // (Astro-rendered SSG content) stays in place if the placeholder had
    // any non-empty content before we touched it.
    console.warn('[live-hydrate]', kind, e)
  }
}

function hydrateAll() {
  document
    .querySelectorAll<HTMLElement>('[data-live]')
    .forEach((el) => void hydrateOne(el))
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateAll, { once: true })
  } else {
    hydrateAll()
  }
  // Refresh every 30s while page is open so leaderboards stay current
  // without a reload.
  setInterval(hydrateAll, 30_000)
}

export {}
