# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

G-Gravitator serves four distinct audiences through one unified headquarters (`ggravitator.xyz`):

1. **Enterprise & Startup Technical Buyers (G-Gravitator Systems):** Founders, CTOs, and operations leads looking to scope and ship high-ROI AI workflows, custom multi-agent systems, or rapid production MVPs in weeks rather than quarters.
2. **Prosumers & Technical Operators (G-Gravitator Labs):** Builders, founders, and SME operators evaluating and adopting G-Gravitator's numbered commercial software drops (`G-01` through `G-04`).
3. **Hackathon Builders, Judges & Open-Source Engineers (OXAKALABS Skunkworks & Live Hackathon Radar):** Active builders hunting high-signal global AI hackathons (including breaking X/Twitter announcements), reviewing 48-hour prototypes, and testing product viability with the 25-point Graduation Scorecard.
4. **Incoming Engineers & Design Engineers (G-Gravitator Orbit):** Ambitious engineers, designers, and technical students applying for selective 6-week Gravity Cycles training cohorts, residencies, and Demo Days, plus readers following Lab Dispatches and the Orbital Wire.

## Product Purpose

G-Gravitator is a software and AI creativity lab built on a simple thesis: great ideas, strong engineering talent, and markets converge around high-mass builders. The digital headquarters must:

- Route each visitor cleanly to the right division without blending enterprise sales, product drops, open R&D, and builder training into one noisy pitch.
- Convert enterprise prospects into scoped B2B engagements via transparent service tiers (USD and NGN) and the interactive Project Scope Drawer.
- Operate as a live, repeat-visit utility for the builder community through the multi-provider Live Hackathon Radar (`/hackathons`) and dual-track AI & Tech Journal (`/journal`).
- Present OXAKALABS as G-Gravitator's authentic 48-hour Skunkworks and hackathon strike arm feeding validated prototypes into commercial Labs drops.

## Positioning

Unlike traditional dev agencies that only trade hours for services, or pure hackathon teams that abandon prototypes after demo day, G-Gravitator operates a four-unit compounding flywheel:

1. **G-Gravitator Systems (`/systems`):** High-ticket B2B AI and full-stack product engineering (Gravity Audit, Velocity MVP, Lab Retainer) that funds lab operations and sharpens real-world production patterns.
2. **G-Gravitator Labs (`/labs`, `/labs/[slug]`):** Proprietary commercial software shipped as numbered drops (`G-01 Gravity Deck`, `G-02 OpsPilot`, `G-03 Kinetic Studio`, `G-04 OrbitBench`).
3. **OXAKALABS Skunkworks (`/skunkworks`, `/hackathons`):** Established in 2022, operating as G-Gravitator's experimental R&D foundry and 48-hour hackathon strike team. Prototypes scoring 20 to 25 out of 25 on the Graduation Filter promote directly into Labs drops.
4. **G-Gravitator Orbit (`/orbit`):** Selective 6-week Gravity Cycles training builders across Applied AI Engineering, Full-Stack Product Systems, and Kinetic Design Engineering.

## Operating Context

- **Primary Web Stack:** Next.js 16 (App Router, `output: "standalone"`), React 19, TypeScript (`strict: true`), Tailwind CSS v4, Framer Motion, Supabase (PostgreSQL + RLS), Google Gemini API (`@google/genai`), Zod validation, and Vitest.
- **Core Live Pipelines:**
  - Multi-provider Hackathon Tracker unifying Devpost, DoraHacks, Lablab.ai, MLH, Luma, Devfolio, ETHGlobal, Kaggle, Unstop, and X (Twitter), with cross-source deduplication, confidence gating, `.ics` calendar export, bookmarks, and community URL submission.
  - Dual-track Journal combining original long-form **Lab Dispatches** (with an editorial dark/light reading mode toggle on `/journal/[slug]`) and **The Orbital Wire** (automated AI and tech news feed with 2-sentence Gravity Takes).
  - Protected Curator Console (`/admin`) for approving community hackathon submissions, setting OXAKALABS deployment statuses, and pinning Orbital Wire stories.
- **Local Fallback Continuity:** `lib/seed-fallback.ts` supplies realistic seeded Labs drops, OXAKALABS GitHub builds (`OXA-01` through `OXA-06`), active hackathons, Orbital Wire news, and Lab Dispatches whenever external Supabase credentials are absent.

## Capabilities and Constraints

- **Routes to Preserve Verbatim:** `/`, `/systems`, `/labs`, `/labs/[slug]`, `/skunkworks`, `/hackathons`, `/journal`, `/journal/[slug]`, `/orbit`, `/admin`.
- **API Contracts to Preserve:**
  - `GET /api/hackathons`, `POST /api/hackathons/submit`
  - `GET /api/news`, `GET /api/search`
  - `POST /api/inquiries`, `POST /api/orbit/apply`, `POST /api/subscribe`
  - `POST /api/admin/auth`, `POST /api/admin/curate`
  - `POST /api/cron/ingest-hackathons`, `POST /api/cron/ingest-news`
- **Global Interactive Flows to Preserve:**
  - Keyboard-triggered Command Palette (`⌘K` / `Ctrl+K`) searching routes, drops, hackathons, dispatches, news, and quick actions.
  - Project Scope Drawer triggered via `gg:open-scope-drawer` custom window event and `Initiate build` actions, supporting `GRAVITY_AUDIT`, `VELOCITY_MVP`, `LAB_RETAINER`, and `CUSTOM` tiers.
  - USD (`$`) / NGN (`₦`) currency toggle on `/systems`.
  - Interactive 25-point Graduation Scorecard on `/skunkworks` with thresholds (`20-25` Promote to Labs, `14-19` B2B Case Study & Open Source, `<14` Dispatch & Archive).
  - Live countdown timers, source/format/theme/sort filters, Grid vs. Table view toggle, bookmarks, `.ics` export, and URL submission modal on `/hackathons`.
  - Dark/Light reading mode toggle on `/journal/[slug]` and Weekly Orbital Brief newsletter signup.
- **Legal & Entity Truth:** Operated by G-Gravitator Labs Ltd, operating OXAKALABS (founded 2022). Principal Architect: Enwedo Akaolisa Gift.

## Brand Commitments

- **Core Taglines:** "Build with weight." and "Where ideas gain mass."
- **Monogram:** `GG` (compact architectural mark usable in enterprise boardrooms and builder communities alike).
- **OXAKALABS Continuity:** Never erase or rebrand away OXAKALABS. Present it clearly as G-Gravitator's Skunkworks and hackathon foundry (`OXAKALABS by G-Gravitator`).
- **Voice & Copy Standard:** Engineered, direct, physical, and clear. Prefer concrete verbs (build, ship, compress, verify, deploy) over corporate filler (synergy, revolutionize, seamless, unlock). Write clean sentence-case headlines and direct prose with zero em-dashes and zero fake technical jargon.
- **No Fabricated Claims:** Never invent fake client logos, fake testimonials, fake team headcounts, or unverified metrics. Use only real data from `lib/seed-fallback.ts`, live database feeds, or verified repository artifacts.

## Evidence on Hand

- **Master Specification:** `SPECIFICATIONS/g_gravitator_master_website_specification.md`
- **Authentic Seeded Catalog & Builds:** `lib/seed-fallback.ts`
  - Labs drops: `G-01 Gravity Deck`, `G-02 OpsPilot`, `G-03 Kinetic Studio`, `G-04 OrbitBench`
  - OXAKALABS shipped builds (linked to real GitHub repositories under `github.com/Aka4real`): `OXA-01 DEMOPILOT`, `OXA-02 Nexus Retail Operations Suite`, `OXA-03 All-Things-Agentic Harness`, `OXA-04 Aify Cycle`, `OXA-05 AI-API-ATP`, `OXA-06 Solana Token Launch Forge`
  - 11 realistic hackathon records (including 1 moderation queue record for `/admin`), 8 Orbital Wire news records, and 4 original Lab Dispatches (`001` through `004`).
- **Automated Verification Suite:** `__tests__/gravitator.test.ts` (Vitest unit tests covering Graduation Scorecard thresholds, hackathon noise filtering, X signal normalization, cross-source deduplication, `.ics` export, Orbital Wire synthesis, and Gemini config).
- **Studio Editorial Imagery (`1376×768`, 16:9):** `public/images/hero-gravity-mass.jpg`, `public/images/labs-prism.jpg`, `public/images/skunkworks-forge.jpg`, `public/images/orbit-atelier.jpg`.
- **Absences Not to Fabricate:** No verified third-party customer logo wall or customer testimonials are on hand; do not invent placeholder client logos or quotes.

## Product Principles

1. **Clear Division Routing:** Every visitor immediately understands what G-Gravitator builds and can reach Systems, Labs, Skunkworks, Hackathons, Journal, or Orbit in one click.
2. **Live Utility Over Static Brochure:** The Hackathon Radar, Graduation Scorecard, Command Palette, and Orbital Wire are working engineering tools, not static marketing props.
3. **Calm Authority Over Terminal Theater:** Credibility comes from real shipped work, clear architecture, and legible hierarchy, never from decorative telemetry noise or artificial complexity.
4. **Honest Commercial Transparency:** B2B service tiers clearly state scope, timelines, deliverables, IP handover terms, and both USD and NGN pricing bands upfront.

## Accessibility & Inclusion

- Meet WCAG 2.1 AA contrast across all text, form labels, placeholders, error states, and filled CTAs (minimum 4.5:1 for body and UI labels, 3:1 for large display headings).
- Full keyboard navigation across Navbar, floating Command Palette (`⌘K`), Scope Drawer (including Escape dismissal), filter controls, and forms.
- Explicit visible `<label>` elements above every form field (never placeholder-as-label) with inline validation feedback.
- Full support for `prefers-reduced-motion: reduce`, `prefers-reduced-transparency: reduce`, and `prefers-contrast: more`.
