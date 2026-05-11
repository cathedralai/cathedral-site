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
  redirects: {
    '/workforce': '/agents',
    '/afrotensor': '/',
  },
  vite: {
    server: { port: 4321 },
  },
})
