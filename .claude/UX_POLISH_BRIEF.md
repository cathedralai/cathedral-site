# UX polish brief (Fred, 2026-05-11)

## Goal

Level up cathedral.computer to converge with the design kit, while the
verified-runtime path is being proven end-to-end. **Re-skin, not
rebuild.** Preserve working capabilities.

End-state (combined with concurrent work):
- 3-4 real soul.md flavors mining on Polaris-attested runtime
- 5-10 real card responses scored on the leaderboard
- Validator chain weights flowing on testnet
- Site looks, reads, and is structured per the design

## Sources (Fred's Downloads)

- `/Users/dreamboat/Downloads/sources/` — source files
- `/Users/dreamboat/Downloads/preview/` — visual previews
- `/Users/dreamboat/Downloads/ui_kits/cathedral_site/` — open HTML in browser to see target
- `/Users/dreamboat/Downloads/assets/` — rose-window.svg, favicon, brand marks
- `/Users/dreamboat/Downloads/handoff/` — the contract:
  - `handoff/README.md` — orientation
  - `handoff/01-positioning.md` — voice, copy, audience tabs
  - `handoff/02-build-checklist.md` — the worklist
  - `handoff/03-design-system.md` — tokens, motion, vocabulary
- `colors_and_type.css` — port into `src/styles/tokens.css` + `tailwind.config.mjs`

## Ground truth rules

**Production code wins on facts:**
- Only render features that exist in `cathedral-site/` today
- API/`src/lib/types.ts` is real; kit's mock data is layout only
- If API doesn't return a field, don't render it (don't fake it)
- Whatever the live site does today is baseline; we level up, not rewrite

**Design wins on form:**
- Tokens (color, type, spacing, motion) — port from `colors_and_type.css`
- Voice + copy — use `handoff/01-positioning.md` wording
- Visual vocabulary — hairline contact-sheet grids, one accent, no rounded corners except pills, no decoration that isn't load-bearing
- Structural intent — `/plans` route, `/feeds/regulatory/*` URL move with
  redirects, scoring weights config keyed by domain, audience tabs
  (I'm a human / I'm an agent)
- Brand mark — `assets/rose-window.svg` + favicon

## When design and reality conflict

PAUSE and surface. Don't silently pick.

- Kit shows stat the API can't compute → expose what API returns, or remove. Never invent.
- Kit shows feature backend doesn't have → only claim it if it actually runs.
- Kit shows page that has no route (e.g. `/plans` with seeded drafts) →
  scaffold the route, place "RUBRIC PENDING — human draft required" placeholder; don't invent rubrics.
- Kit shows mock agents like athena-04 → use real registry; empty state if empty.

## Never

- Ship a page promising a feature that doesn't exist
- Empty "coming soon" surfaces (no `/feeds/markets`, `/feeds/science`)
- Invent agent names, hashes, stats, timestamps, scores
- Copy claiming capabilities the system doesn't run
- Rewrite working components for cosmetic changes
- Promote `/feeds` to top nav until a second feed ships

## Always

- **Diff first** — list gaps between current page and kit reference; pick smallest changes for biggest win
- Preserve redirects when renaming routes
- Mark deferred items, don't block on them, don't fake around them
- Ask Fred when ambiguous (stats, capability claims, rubrics, routes that promise features)

## Workmode

Top-down through `handoff/02-build-checklist.md`. Ship per section.
