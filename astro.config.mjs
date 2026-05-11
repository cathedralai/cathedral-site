import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  site: 'https://cathedral.computer',
  integrations: [tailwind()],
  output: 'static',
  // IA cleanup: /workforce was renamed to /agents (the agent registry).
  // Astro emits a static HTML redirect page for each entry so legacy links
  // and external references keep resolving. /afrotensor was killed; we
  // bounce it home rather than 404 so any inbound link still lands.
  // /cards → /jobs: vocab rename. In the v1 model, "jobs" are the
  // standing work Cathedral publishes (rubric + source pool) and "cards"
  // are miner submissions answering a job. Old /cards URLs continue to
  // resolve via these redirects so external links don't break.
  redirects: {
    '/workforce': '/agents',
    '/afrotensor': '/',
    '/cards': '/jobs',
    '/cards/[id]': '/jobs/[id]',
    '/cards/[id]/feed': '/jobs/[id]/feed',
    '/cards/[id]/leaderboard': '/jobs/[id]/leaderboard',
    '/cards/[id]/submit': '/jobs/[id]/submit',
    '/cards/[id]/discovery': '/jobs/[id]/discovery',
    '/cards/[id]/eval-spec': '/jobs/[id]/eval-spec',
  },
  vite: {
    server: { port: 4321 },
  },
})
