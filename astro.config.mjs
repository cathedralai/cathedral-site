import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  site: 'https://cathedral.computer',
  integrations: [tailwind()],
  output: 'static',
  // IA cleanup: the home page is now the jobs list, and each job page
  // carries its own procession (top agents) and wall (last 24h of stones),
  // so the old standalone /jobs, /leaderboard, /agents indexes are gone —
  // along with per-job /feed, /leaderboard, /discovery sub-pages, which
  // the wall + procession + stone clicks now cover. Old paths bounce to
  // the closest live surface so inbound links keep resolving.
  // /afrotensor was killed earlier; we bounce it home as well.
  // /cards → /jobs: vocab rename. In the v1 model, "jobs" are the
  // standing work Cathedral publishes (rubric + source pool) and "cards"
  // are miner submissions answering a job.
  redirects: {
    '/workforce': '/',
    '/afrotensor': '/',
    '/jobs': '/',
    '/leaderboard': '/',
    '/agents': '/',
    '/cards': '/',
    '/cards/[id]': '/jobs/[id]',
    '/cards/[id]/feed': '/jobs/[id]',
    '/cards/[id]/leaderboard': '/jobs/[id]',
    '/cards/[id]/discovery': '/jobs/[id]',
    '/cards/[id]/submit': '/jobs/[id]/submit',
    '/cards/[id]/eval-spec': '/jobs/[id]/eval-spec',
    '/jobs/[id]/feed': '/jobs/[id]',
    '/jobs/[id]/leaderboard': '/jobs/[id]',
    '/jobs/[id]/discovery': '/jobs/[id]',
  },
  vite: {
    server: { port: 4321 },
  },
})
