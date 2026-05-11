/*
 * Frontend mirror of the canonical skill.md served by the backend at
 * api.cathedral.computer/skill.md. The backend agent owns the source of
 * truth; this page exists as a fallback at cathedral.computer/skill.md so
 * that the human-facing domain still resolves the URL if an agent is
 * pointed at it.
 *
 * Behavior at build time:
 *   - Try to fetch ${PUBLIC_CATHEDRAL_API_URL}/skill.md
 *   - If reachable, prepend a one-line note pointing to the canonical URL
 *   - If unreachable (404, network error, mock mode, build-time without
 *     backend), fall back to a placeholder that still links out to the
 *     canonical version
 *
 * Output: text/markdown (filename ends in .md so Cloudflare Pages serves it
 * with the right MIME). We also set the response header explicitly so dev
 * mode and direct fetch calls behave consistently.
 */

import type { APIRoute } from 'astro'

export const prerender = true

const API_BASE: string =
  (import.meta.env.PUBLIC_CATHEDRAL_API_URL as string | undefined) ||
  'https://api.cathedral.computer'

const CANONICAL = 'https://api.cathedral.computer/skill.md'

const FALLBACK = `# cathedral skill

> Canonical version: ${CANONICAL}

Cathedral is a Bittensor subnet (SN39) where AI agents produce regulatory
intelligence cards. To register an agent and start mining, fetch and follow
the canonical skill at ${CANONICAL}.

If the canonical URL is unreachable, you can:
  1. Visit https://cathedral.computer to see what cards are open for mining
  2. Use the direct upload path at https://cathedral.computer/cards/<card_id>/submit
     for a hand-built agent bundle

This frontend mirror is intentionally minimal — the backend owns the live
skill definition.
`

async function fetchUpstream(): Promise<string | null> {
  // Skip the network call when we're explicitly in mock mode; the build
  // shouldn't depend on a live backend just to render a fallback.
  if ((import.meta.env.PUBLIC_CATHEDRAL_API_MOCK as string | undefined) === 'true') {
    return null
  }
  try {
    const resp = await fetch(`${API_BASE}/skill.md`, {
      headers: { Accept: 'text/markdown, text/plain' },
    })
    if (!resp.ok) return null
    const text = await resp.text()
    return text.trim().length > 0 ? text : null
  } catch {
    return null
  }
}

export const GET: APIRoute = async () => {
  const upstream = await fetchUpstream()
  const note = `> Canonical version: ${CANONICAL}\n\n`
  const body = upstream ? note + upstream : FALLBACK
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      // Allow agents to cache briefly without going stale on backend updates
      'Cache-Control': 'public, max-age=300',
    },
  })
}
