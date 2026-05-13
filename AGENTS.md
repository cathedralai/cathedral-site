# AGENTS.md

This file is read automatically by coding agents (Cursor, Claude, etc.)
working on this repo. Keep it short. The full brief lives in `DESIGN.md`.

## Mission (one line)

> The world's fastest-evolving, fully verifiable agent workforce.

## Required reading before any UI / copy change

1. `DESIGN.md` — design system, voice, anti-patterns.
2. The page you are editing (read it whole, not just the diff target).
3. The relevant component in `src/components/`.

## Defaults

- Treat this as a **workforce game shaped like a cathedral**, not a
  marketing site.
- The aesthetic is **slate, dark, mid-century print, sacred about
  evidence**. Newsreader 300 + JetBrains Mono. Nothing else.
- Copy is **plain, declarative, evidence-first**. Numbers before
  adjectives. Marketing words (powerful, seamless, revolutionary,
  AI-powered, unleash, supercharge) are forbidden. See `DESIGN.md §5`.
- Live data is the hero. If a value can be live, it is live.
- Every page opens with a **verb-first line**: what you can do here,
  now. "Mine a job." "Lay a stone." "Read the brief." Buttons continue
  the verb; never `JOIN NOW`.

## Hard nos

- No marketing tropes (testimonials, FAQs, pricing tables, "trusted by"
  logos, comparison grids).
- No drop shadows, glassmorphism, glow, gradients beyond the palette.
- No emojis as UI. No decorative emojis in copy.
- No "coming soon" without a date or explicit condition.
- No tooltips for content that belongs inline.
- No client-side framework runtimes (React, Vue, Svelte). Astro +
  vanilla JS only.
- No `console.log` in committed code.

## When unsure

- Read `DESIGN.md` again.
- Ask the user before adding decoration. Default is **less**.
- Prefer editing existing copy over adding new copy.
- Prefer one well-built section over three half-built ones.

## Stack reminders

- **Astro 5** static-first. Components are `.astro`.
- **Tailwind 3** utilities are fine but the visual system is built
  with CSS variables in `src/layouts/Base.astro`. Prefer tokens
  (`var(--accent)`, `var(--muted)`, `var(--border-soft)`) over Tailwind
  colour classes when styling brand elements.
- **Live data** loads after first paint via `requestIdleCallback`. Do
  not move it to the frontmatter await — that blocks SSR.
- **Mobile** rules live under `@media (max-width: 640px)` in each
  page. Touch targets ≥ 44px, email inputs ≥ 48px.

## Performance budget

- Lighthouse Performance ≥ 95 desktop, ≥ 85 mobile. CLS < 0.05.
- The whole homepage including fonts is < 60KB transferred.
- Don't add npm dependencies without asking.

## Commit style

- Conventional commits: `feat:`, `fix:`, `refine:`, `copy:`, `perf:`.
- Subject ≤ 72 chars. Body explains *why* in 1–3 lines, not *what*.
- One concern per commit. Squash before merging if needed.
