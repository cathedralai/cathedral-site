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
 *   - `data-live="leaderboard|card-overview-stats|recent-feed|agent-evals|cards-index|wall|status-strip"`
 *   - `data-card-id` (for card-scoped surfaces)
 *   - `data-agent-id` (for agent-scoped surfaces)
 *   - `data-limit` (optional)
 *
 * Surfaces render their own structure inline; we replace `innerHTML`
 * with the freshly-fetched version so styles stay scoped.
 */

import {
  pickQualifiedLeaderboard,
  renderWallGridHtml,
  wallGridFingerprint,
  wallLegendAria,
  wallLiveStats,
  wallPressureAria,
  type WallFeedRow,
  type WallLeaderRow,
} from './wall-live'

const API_BASE =
  (typeof window !== 'undefined' &&
    (window as Window & { __CATHEDRAL_API__?: string }).__CATHEDRAL_API__) ||
  'https://cathedral-publisher-production.up.railway.app'

/** Publisher routes live under /v1 (not /api/cathedral on static deploy). */
function v1(path: string): string {
  return path.startsWith('/v1/') ? path : `/v1/${path.replace(/^\//, '')}`
}

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

// Site-wide live status strip — the heartbeat that sits under the nav on
// every page. Renders inner content of `.cd-status`; the parent's
// `data-status-tone` attribute is updated separately so the pulse colour
// follows the freshness of the last card.

function deriveStatusTone(lastRanAt: string | undefined): {
  tone: 'live' | 'warming' | 'quiet' | 'offline'
  label: string
} {
  if (!lastRanAt) return { tone: 'quiet', label: 'workforce · listening' }
  const ms = Date.now() - new Date(lastRanAt).getTime()
  if (ms < 60 * 60 * 1000) return { tone: 'live', label: 'workforce · live' }
  if (ms < 24 * 60 * 60 * 1000)
    return { tone: 'warming', label: 'workforce · warming' }
  return { tone: 'quiet', label: 'workforce · quiet' }
}

function renderStatusStripInner(
  latest: EvalOutput | undefined,
  latestEpoch: number | null,
): string {
  const { label } = deriveStatusTone(latest?.ran_at)
  const lastStoneAge = latest?.ran_at ? RELATIVE_TIME(latest.ran_at) : '—'
  const epochSegment =
    latestEpoch !== null
      ? `<span class="cd-status-sep" aria-hidden="true">·</span><span class="cd-status-stat">merkle epoch <strong>${ESC(String(latestEpoch))}</strong></span>`
      : ''
  return `
    <span class="cd-status-dot" aria-hidden="true"></span>
    <span class="cd-status-tone">${ESC(label)}</span>
    <span class="cd-status-sep" aria-hidden="true">·</span>
    <span class="cd-status-stat">last stone <strong>${ESC(lastStoneAge)}</strong></span>
    ${epochSegment}
    <span class="cd-status-spacer" aria-hidden="true"></span>
    <a class="cd-status-link" href="/">Mine a job →</a>
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

// Replace innerHTML only if the new markup differs from what's there.
// Astro renders the same surface at build time; if the API returns the
// same shape, we'd otherwise cause a visible flicker on every poll.
function applyIfChanged(el: HTMLElement, next: string): void {
  if (el.innerHTML.trim() === next.trim()) return
  el.innerHTML = next
}

function markWallYou(grid: HTMLElement): void {
  let myId = ''
  try {
    myId = localStorage.getItem('cd:agent_id') || ''
  } catch {
    /* ignore */
  }
  if (!myId) return
  grid.querySelectorAll<HTMLElement>('[data-agent-id]').forEach((stone) => {
    if (stone.dataset.agentId === myId) stone.classList.add('you')
  })
}

function updateWallChrome(
  wallEl: HTMLElement,
  stats: ReturnType<typeof wallLiveStats>,
): void {
  const pressure = wallEl.querySelector<HTMLElement>('.wall-pressure')
  if (pressure) {
    pressure.setAttribute('aria-label', wallPressureAria(stats))
    pressure.innerHTML = `<strong>${stats.laid}</strong> crowned<span class="wall-pressure-sep" aria-hidden="true">·</span><strong>${stats.accepted24h}</strong> qualified<span class="wall-pressure-sep" aria-hidden="true">·</span><strong>${stats.rejected24h}</strong> below`
  }
  const legend = wallEl.querySelector<HTMLElement>('.legend')
  if (legend) legend.setAttribute('aria-label', wallLegendAria(stats))
  wallEl.querySelector('[data-wall-drift]')?.remove()
  wallEl.classList.remove('cd-wall-pulse')
  delete wallEl.dataset.driftSeen
}

async function hydrateWall(wallEl: HTMLElement, cardId: string): Promise<void> {
  const [leaderboard, feed] = await Promise.all([
    fetchJSON<LeaderboardPage>(
      v1(`leaderboard?card=${encodeURIComponent(cardId)}&limit=72`),
    ),
    fetchJSON<FeedPage>(
      v1(`cards/${encodeURIComponent(cardId)}/feed?limit=96`),
    ).catch(() => ({ items: [] }) as FeedPage),
  ])

  const scored = pickQualifiedLeaderboard(
    (leaderboard.items || []) as WallLeaderRow[],
  )
  const feedRows: WallFeedRow[] = (feed.items || []).map((e) => ({
    agent_id: e.agent_id,
    ran_at: e.ran_at,
    weighted_score: e.weighted_score,
  }))
  const stats = wallLiveStats(scored, feedRows)
  const fp = wallGridFingerprint(scored, stats.open)
  if (wallEl.dataset.wallLiveFp === fp) {
    updateWallChrome(wallEl, stats)
    return
  }
  wallEl.dataset.wallLiveFp = fp

  const grid = wallEl.querySelector<HTMLElement>('[data-wall-grid]')
  if (!grid) return

  const nextGrid = renderWallGridHtml(cardId, scored)
  if (grid.innerHTML.trim() !== nextGrid.trim()) {
    grid.innerHTML = nextGrid
    markWallYou(grid)
  }
  updateWallChrome(wallEl, stats)
}

async function hydrateOne(el: HTMLElement): Promise<void> {
  const kind = el.dataset.live
  const cardId = el.dataset.cardId || ''
  const agentId = el.dataset.agentId || ''
  const limit = Number(el.dataset.limit || '50')

  try {
    if (kind === 'leaderboard' && cardId) {
      const d = await fetchJSON<LeaderboardPage>(
        v1(
          `leaderboard?card=${encodeURIComponent(cardId)}&limit=${limit}`,
        ),
      )
      applyIfChanged(el, renderLeaderboard(d.items || []))
    } else if (kind === 'recent-feed' && cardId) {
      const d = await fetchJSON<FeedPage>(
        v1(`cards/${encodeURIComponent(cardId)}/feed?limit=${limit}`),
      )
      applyIfChanged(el, renderRecentFeed(d.items || []))
    } else if (kind === 'card-overview-stats' && cardId) {
      const d = await fetchJSON<CardOverview>(
        v1(`cards/${encodeURIComponent(cardId)}`),
      )
      applyIfChanged(el, renderCardOverviewStats(d))
    } else if (kind === 'agent-evals' && agentId) {
      const d = await fetchJSON<AgentProfileResponse>(
        v1(`agents/${encodeURIComponent(agentId)}`),
      )
      applyIfChanged(el, renderAgentEvals(d.recent_evals || []))
      // Also live-update the score/rank header if present.
      document.querySelectorAll<HTMLElement>('[data-live-score]').forEach((s) => {
        const next = SCORE(d.current_score)
        if (s.textContent !== next) s.textContent = next
      })
      document.querySelectorAll<HTMLElement>('[data-live-rank]').forEach((s) => {
        const next = d.current_rank == null ? '—' : `#${d.current_rank}`
        if (s.textContent !== next) s.textContent = next
      })
    } else if (kind === 'status-strip') {
      // Card feed is newest-first. /v1/leaderboard/recent is ascending cursor
      // order, so items[0] there is the oldest row in the since window.
      const statusCardId = el.dataset.cardId || 'eu-ai-act'
      const feed = await fetchJSON<FeedPage>(
        v1(`cards/${encodeURIComponent(statusCardId)}/feed?limit=12`),
      )
      const items = feed.items || []
      const latest = items[0]
      const epochs = items
        .map((e) => e.merkle_epoch ?? null)
        .filter((e): e is number => e !== null)
      const latestEpoch = epochs.length ? Math.max(...epochs) : null
      const { tone } = deriveStatusTone(latest?.ran_at)
      el.dataset.statusTone = tone
      applyIfChanged(
        el,
        renderStatusStripInner(latest, latestEpoch),
      )
    } else if (kind === 'wall' && cardId) {
      await hydrateWall(el, cardId)
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
              v1(`cards/${encodeURIComponent(cardId)}`),
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

// Module-scoped refresh state, so re-bootstraps from astro:page-load /
// initial-load don't stack multiple timers + visibility listeners.
let refreshTimer: number | null = null
let visibilityBound = false

function startRefreshLoop() {
  function schedule(ms: number) {
    if (refreshTimer !== null) window.clearTimeout(refreshTimer)
    refreshTimer = window.setTimeout(tick, ms)
  }
  function tick() {
    if (document.visibilityState === 'visible') hydrateAll()
    schedule(30_000)
  }
  schedule(30_000)
  if (!visibilityBound) {
    visibilityBound = true
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        hydrateAll()
        schedule(30_000)
      }
    })
  }
}

// Schedule the first hydration off the critical path (idle callback,
// falling back to a deferred timeout). Skip the whole script on pages
// with zero data-live placeholders so we don't run a no-op refresh
// timer on the blog, /leaderboard, /how-it-works, etc.
function bootstrap() {
  const targets = document.querySelectorAll('[data-live]')
  if (targets.length === 0) {
    if (refreshTimer !== null) {
      window.clearTimeout(refreshTimer)
      refreshTimer = null
    }
    return
  }

  const ric =
    (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    }).requestIdleCallback ||
    ((cb: () => void) => window.setTimeout(cb, 200))

  ric(() => hydrateAll(), { timeout: 500 })
  startRefreshLoop()
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true })
  } else {
    bootstrap()
  }
}

export {}
