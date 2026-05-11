# Open questions (UX polish pass, 2026-05-11)

These came up during the design-kit converge pass and need Fred's call
before the next iteration.

## 1. `/plans` rubrics — pending human draft

The build-checklist (`handoff/02-build-checklist.md` §C.2) says:
- The agent must NOT ship invented rubrics.
- Either get rubrics from the human first, OR mark each card
  `RUBRIC PENDING — human draft required`.

I shipped the structural scaffold with six categories from §C.2 and the
PENDING marker. The kit's `ui_kits/cathedral_site/plans.html` does
contain rubrics that the design author drafted — but those are the
design author's choices, not Fred's. They should be reviewed before
they show up on the live site.

What Fred can do:
- For each of the six categories on `/plans`, write the four-tuple
  (`task`, `scope`, `sources`, `rubric` axes + weights summing to 1.0,
  `cadence`, `readers`).
- Or pick which of the six are "Q3 2026 / Q4 2026 / Q1 2027" so the
  `opens` field is no longer "TBD".
- Reference rubrics in the kit (kept for record, not shipped):
  see `plans.html` lines 200-560.

Until then `/plans` ships with the PENDING pill on every card.

## 2. `/feeds/regulatory/*` URL move — deferred

`handoff/02-build-checklist.md` §D specifies moving:
- `/cards/{id}/...` → `/feeds/regulatory/cards/{id}/...`
- `/agents/{id}` → `/feeds/regulatory/agents/{id}`
- `/api/v1/cards/...` → `/api/v1/feeds/regulatory/cards/...`

Cost is high (every getStaticPaths + every internal link + 301 redirects
+ API contract change). Benefit is forward-compat for a second feed
that doesn't exist yet. Per Fred's overlay brief: "skip if brief doesn't
specify a route move" — the build-checklist DOES specify it, but the
re-skin scope says "preserve working capabilities". This is a structural
change, not a re-skin.

**Decision needed:**
- (a) Ship in a follow-up PR (own feature branch) with redirects + API
  contract change coordinated with the backend.
- (b) Defer until the second feed (markets / science) is real, and rename
  at the same time as the new feed's first card lands.

I left routes at `/cards/*` and `/agents/*` for now.

## 3. Domain-tag schema (`Card.domain`) — deferred

Build-checklist §E.1 + §E.2: add `domain: 'regulatory'` to card types,
and a `scoring-profiles.ts` keyed by domain.

Same calculus as #2 — single-architectural-change argument is sound,
but it's a backend type change as much as a frontend one, and adds
nothing visible until a second domain exists. Deferred.

## 4. Top nav slot allocation

Current top nav (in order): workforce · how it works · plans · dashboard
· research · afrotensor · roadmap · changelog · github.

Kit nav (`ui_kits/cathedral_site/index.html`): workforce · how it works ·
plans · dashboard · changelog · github.

I added `plans` (per brief §C.3 — "between how it works and dashboard")
and kept `research`, `afrotensor`, and `roadmap` in place since those
are real shipped routes. The kit doesn't show them because the kit
covers canonical product only.

**Decision needed:** keep `research`, `afrotensor`, and `roadmap` in
the nav, or demote them to the footer / a project page? They make
the nav crowded but they're real pages.

## 5. Audience tab seam

Brief §G of `01-positioning.md` says the audience tab toggle lives on
the home hero. It already does. The buyer-vs-miner split is also already
expressed by the page split (home vs. workforce). I didn't add a second
copy of the toggle on `/workforce` because the page itself is the
buyer-→-miner pivot. Confirm this matches Fred's intent.

## 6. Card detail (`/cards/{id}`) layout — no rewrite

The kit's `card.html` uses a sub-tabs UI (leaderboard / outputs / eval
spec / submit) inside a single page. The production site uses separate
sub-routes (`/cards/{id}`, `/cards/{id}/leaderboard`, `/cards/{id}/feed`,
`/cards/{id}/eval-spec`, `/cards/{id}/submit`).

That's a structural difference. Per the brief: "Don't rewrite working
components for cosmetic changes." Left as-is. The sub-tab pattern can
become a follow-up if Fred prefers single-page-with-tabs.

## 7. Discovery surface — left alone

`/cards/{id}/discovery` and the discovery section on `/cards/{id}` were
added on `feature/discovery-surface` and landed in main right before this
pass (PR #90). The kit doesn't have a discovery surface. I treated the
discovery section as load-bearing (it's real, it ships unverified
agents). Left visuals alone. If Fred wants discovery folded into a tab
under the card detail, that's a follow-up.