---
name: G-Gravitator
description: Kinetic Obsidian & Floating Glass visual system for ggravitator.xyz.
colors:
  obsidian-canvas: "#08080A"
  obsidian-elevated: "#111114"
  obsidian-subtle: "#18181D"
  obsidian-card-hover: "#16161A"
  alabaster-ink: "#F4F3EF"
  titanium-secondary: "#A1A1AA"
  pewter-tertiary: "#8B8B94"
  hairline-subtle: "rgba(255, 255, 255, 0.08)"
  hairline-active: "rgba(255, 255, 255, 0.18)"
  glass-fill: "rgba(14, 14, 18, 0.72)"
  glass-border: "rgba(255, 255, 255, 0.09)"
  ion-vermilion: "#FF3B1F"
  ion-vermilion-hover: "#FF5238"
  ion-vermilion-soft: "rgba(255, 59, 31, 0.12)"
  status-live: "#10B981"
  status-warning: "#F59E0B"
  reading-alabaster-bg: "#F4F3EF"
  reading-obsidian-ink: "#111114"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 5.2vw, 5.25rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 3.2vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.8vw, 1.625rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
  telemetry:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
    fontFeature: "'tnum' 1"
rounded:
  stamp: "8px"
  control: "12px"
  surface: "16px"
  sheet: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  section-sm: "80px"
  section-lg: "128px"
components:
  button-primary:
    backgroundColor: "{colors.ion-vermilion}"
    textColor: "{colors.obsidian-canvas}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "11px 22px"
  button-primary-hover:
    backgroundColor: "{colors.ion-vermilion-hover}"
    textColor: "{colors.obsidian-canvas}"
  button-secondary:
    backgroundColor: "{colors.obsidian-subtle}"
    textColor: "{colors.alabaster-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "11px 22px"
  chip-filter:
    backgroundColor: "{colors.obsidian-elevated}"
    textColor: "{colors.titanium-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
  chip-filter-active:
    backgroundColor: "{colors.alabaster-ink}"
    textColor: "{colors.obsidian-canvas}"
  card-surface:
    backgroundColor: "{colors.obsidian-elevated}"
    textColor: "{colors.alabaster-ink}"
    rounded: "{rounded.surface}"
    padding: "24px"
  input-field:
    backgroundColor: "{colors.obsidian-elevated}"
    textColor: "{colors.alabaster-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  nav-bar:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.alabaster-ink}"
    rounded: "{rounded.pill}"
    height: "56px"
    padding: "0 16px"
---

# Design System: G-Gravitator

## Overview

**Creative North Star: "Kinetic Obsidian & Floating Glass"**

Reading this as: a full visual overhaul of a multi-unit software and AI creativity lab headquarters (`ggravitator.xyz`) for enterprise B2B founders, technical builders, and product users, replacing a boxy 0px spreadsheet-terminal aesthetic with sculptural editorial minimalism and Apple fluid hardware craft. Calibration dials: `DESIGN_VARIANCE: 8`, `MOTION_INTENSITY: 6`, `VISUAL_DENSITY: 4` (with clean high-scanability Operate mode on `/hackathons` and `/admin`, and focused Read mode on `/journal`).

G-Gravitator should feel like a precision physical instrument suspended in dark architectural space, never like a wireframe spreadsheet or an AI developer boilerplate. Content breathes openly across a deep matte obsidian canvas (`#08080A`), separated by generous vertical rhythm and tonal stepping (`#111114` and `#18181D`) rather than exposed page cages or repeating borders. Navigation, command search, and project-scoping drawers float above content as translucent frosted glass layers with physical light-catching top edges and critically damped spring motion.

Every surface rejects generic AI templates: no sharp 0px boxed grids, no `+` crosshair corner markers, no uppercase monospace section kickers or `01 //` numbering prefixes, no split two-column section headers, no em-dashes in visible copy, and no div-based fake screenshots. Four cohesive dark-studio photographs anchor the visual world alongside restrained, velocity-aware motion.

**Key Characteristics:**
- Deep obsidian dark theme lock (`#08080A`) with alabaster ink (`#F4F3EF`) and one surgical ion vermilion accent (`#FF3B1F`).
- Expressive sentence-case `Bricolage Grotesque` display typography paired with crisp `Geist` UI/body copy and strictly functional `Geist Mono` data telemetry.
- Consistent soft sculptural geometry (`rounded-full` pills for actions and filters, `rounded-2xl` surfaces for cards and imagery, `rounded-xl` for inputs and compact items).
- Translucent floating chrome (honest web frosted-glass approximation using `backdrop-filter: blur(20px) saturate(180%)` with solid fallbacks for reduced transparency).
- Interruptible, critically damped Apple/Emil spring motion (`SPRING_UI` and `SPRING_SHEET`), instant tactile `:active` press feedback, and zero animation on keyboard-triggered `⌘K` search.

## Colors

A disciplined monochrome obsidian palette calibrated for WCAG AA legibility, punctuated by a single high-energy ion vermilion signal and reserved semantic states.

### Primary
- **Ion Vermilion** (`#FF3B1F` / `--accent-ion`): Primary CTAs, active focus rings, urgent `<48h` hackathon countdown states, and razor-thin highlight accents. Hover lifts to `#FF5238`; soft contextual fill uses `rgba(255, 59, 31, 0.12)`. Always pair `#FF3B1F` filled pills with `#08080A` obsidian ink (contrast ratio ~5.6:1, passing WCAG AA).

### Neutral
- **Deep Obsidian** (`#08080A` / `--bg-primary`): Primary full-bleed dark canvas across every route.
- **Matte Obsidian** (`#111114` / `--bg-elevated`): Primary elevated containers, surface cards, drawers, modals, and form fields.
- **Sculpted Obsidian** (`#16161A` / `#18181D` / `--bg-subtle`): Hover fill states, secondary pill buttons, subtle nested control tracks, and tonal contrast tiles.
- **Alabaster Ink** (`#F4F3EF` / `--text-primary`): Primary headings, button labels on dark surfaces, active nav items, and key values (>17:1 on `#08080A`).
- **Muted Titanium** (`#A1A1AA` / `--text-secondary`): Body paragraphs, supporting descriptions, and inactive navigation links (≥7.4:1 on `#08080A`, ≥6.8:1 on `#111114`).
- **Readable Pewter** (`#8B8B94` / `--text-tertiary`): Captions, timestamps, helper copy, and secondary metadata (≥5.5:1 on `#08080A`, ≥5.0:1 on `#111114`). Never drop readable copy below `#8B8B94`.
- **Hairline Light Catch** (`rgba(255, 255, 255, 0.08)` / `--border-subtle`): Quiet structural dividers and surface rims; shifts to `rgba(255, 255, 255, 0.18)` (`--border-active`) on hover or focus.
- **Semantic Live Emerald** (`#10B981` / `--status-live`): Strictly reserved for genuinely live feeds, open hackathon windows, and active deployment statuses.
- **Semantic Closing Amber** (`#F59E0B` / `--status-warning`): Strictly reserved for `<72h` closing warnings and scouting status tags.
- **Editorial Reading Light (Scoped Exception Only):** Inside `/journal/[slug]` when the reader explicitly activates the light reading mode toggle, surface shifts smoothly to `#F4F3EF` with `#111114` primary ink and `#52525B` secondary ink.

### Named Rules

**The Page Theme Lock Rule.** Every route renders in unified deep obsidian dark mode (`#08080A`). Never flip individual marketing sections to light mode mid-scroll. The sole permitted light canvas is the user-toggled long-form reading mode inside `/journal/[slug]`.

**The Single Surgical Accent Rule.** Ion Vermilion (`#FF3B1F`) is the only brand accent across the entire site and occupies at most 10% of any viewport. Never introduce AI purple, electric cyan, or per-section rainbow accents.

**The Obsidian-on-Ion Contrast Rule.** Filled `#FF3B1F` buttons and pills always carry `#08080A` dark ink (`font-medium` or `font-semibold`) so button labels pass WCAG AA (≥5.6:1) at every size.

## Typography

**Display Font:** `Bricolage Grotesque` (loaded via `next/font/google`, weights `500`, `600`, `700`, `800`, CSS variable `--font-display`, fallback `system-ui, sans-serif`)
**Body Font:** `Geist` (loaded via `next/font/google`, CSS variable `--font-sans`, fallback `system-ui, sans-serif`)
**Telemetry / Mono Font:** `Geist Mono` (loaded via `next/font/google`, CSS variable `--font-mono`, fallback `ui-monospace, monospace`)

**Character:** Sculptural, contemporary, and architectural. `Bricolage Grotesque` brings unmistakable human hardware-craft character in sentence case with optical sizing, while `Geist` delivers calm, high-legibility UI and editorial prose, and `Geist Mono` stays strictly honest for live numerals, codes, and keyboard shortcuts.

### Hierarchy
- **Display** (`700`–`800`, `clamp(2.5rem, 5.2vw, 5.25rem)`, line-height `1.04`–`1.06`, tracking `-0.03em`, `font-optical-sizing: auto`): Page hero titles (`h1`) in Sentence Case, capped at 2 lines on desktop and strictly ≤6rem.
- **Headline** (`600`–`700`, `clamp(1.875rem, 3.2vw, 3rem)`, line-height `1.08`, tracking `-0.025em`): Major section headings (`h2`) in Sentence Case, standing cleanly on their own with zero eyebrow/kicker above them.
- **Title** (`600`, `clamp(1.25rem, 1.8vw, 1.625rem)`, line-height `1.2`, tracking `-0.02em`): Card titles, product drop names (`Gravity Deck`, `OpsPilot`), and division stage titles.
- **Body** (`400`, `16px` / `1rem`, line-height `1.6`, tracking `0em`, max measure `65ch`): Editorial copy, thesis statements, and card descriptions in `#A1A1AA` (or `#F4F3EF` for lead paragraphs).
- **Label** (`500`, `14px` / `0.875rem`, line-height `1.4`, tracking `0em`): Navigation links, pill buttons, form labels, and filter chips in `Geist`.
- **Telemetry** (`500`, `12px`–`13px`, line-height `1.4`, tracking `+0.02em`, `font-variant-numeric: tabular-nums`): `Geist Mono` exclusively for live countdowns (`01D 10H 24M`), project identifiers (`G-01`, `OXA-01`), prize figures, keyboard shortcuts (`⌘K`), API endpoints, and code snippets.

### Named Rules

**The Sentence-Case Display Rule.** Never force `uppercase` on display headings, buttons, or navigation links. `Bricolage Grotesque` expresses far greater authority and legibility in balanced sentence case (`text-wrap: balance`) with `-0.025em` to `-0.03em` tracking (never tighter than `-0.04em`).

**The Honest Monospace Rule.** `Geist Mono` is reserved strictly for real data, tabular numbers, countdowns, drop codes, shortcuts, and code blocks. Never use monospace as a decorative costume on buttons, prose, navigation, or kickers.

**The Italic Descender Clearance Rule.** Whenever italic emphasis is used within the same font family on a display headline containing descenders (`y g j p q`), enforce `leading-[1.1]` minimum and `pb-1` clearance so strokes never clip. Never mix a random serif word into a sans headline.

## Layout

Open editorial architecture free of vertical framing cages. Pages breathe across an uninterrupted `#08080A` canvas using centered max-width content bands (`max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-12`) and deliberate compositional variety.

- **Breakpoints & Mobile Collapse:** Standard Tailwind breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`). Every multi-column desktop composition explicitly declares its `<768px` single-column stack (`grid-cols-1`) with comfortable mobile padding (`px-5` or `px-6`) and zero horizontal overflow.
- **Vertical Rhythm:** Major page sections separate with generous negative space (`py-20 sm:py-28 lg:py-32`) or a single whisper-subtle horizontal divider (`border-t border-white/[0.07]`), never closed rectangular boxes. Always place more vertical space above a heading than below it.
- **Hero Viewport Discipline:** Keep hero top padding within `pt-24` to `pt-28` on desktop (clearing the floating 56px pill navbar), use `min-h-[100dvh]` (never `h-screen`) when full-viewport framing is desired, limit the hero stack to at most 4 text elements (no tiny taglines below CTAs, no version pills, no ticker clutter), keep headlines ≤2 lines and subtext ≤20 words, and ensure primary CTA + hero visual (`hero-gravity-mass.jpg`) appear cleanly above the fold on 1440×900 desktop.
- **Surface Mode Adaptation:**
  - *Persuade* (`/`, `/systems`, `/orbit`): High-craft editorial pacing, asymmetric splits, generous whitespace, curated top highlights instead of dense walls of text.
  - *Experience* (`/labs`, `/labs/[slug]`, `/skunkworks`): Artifact-first presentation where numbered drops, real GitHub prototypes, studio photography, and interactive tools lead.
  - *Operate* (`/hackathons`, `/admin`): Clean, high-scanability radar and curation tools with sticky translucent filter rails, crisp tabular typography, and instant Grid/Table switching.
  - *Read* (`/journal`, `/journal/[slug]`): Calm editorial hierarchy, `65ch`–`70ch` prose measure, clear table of contents, and optional dark/light reading mode toggle.
- **Compositional Variety & Bento Discipline:** Never repeat the same layout family on two consecutive sections; cap alternating image+text splits at 2 in a row; bento grids must contain exact cell counts matching real content (`N` items = `N` cells, zero blank filler tiles) with visual diversity (editorial imagery, tonal step-ups, interactive stages); long lists (>5 items) use grouped clusters, tabs, or clean tables instead of bare `divide-y` stacks.

### Visual Assets & Photography Framing

Four custom dark-studio editorial photographs live in `public/images/` (all verified `1376×768`, `16:9` / `aspect-video` landscape, zero text or logos, cohesive `#08080A` matte obsidian studio lighting with hairline vermilion accents) and anchor the visual world across routes:

| Asset Path | Dimensions & Aspect | Subject & Framing Notes | Primary Usage |
| :--- | :--- | :--- | :--- |
| `/images/hero-gravity-mass.jpg` | `1376×768` (`16:9`) | Dark anodized titanium and smoked optical glass gravitational sphere positioned in the right third with subtle silver orbital rings, razor-thin vermilion bezel glint, and generous deep obsidian negative space on the left | Home (`/`) Hero visual stage (works as full-bleed ambient right-weighted backdrop or clean `aspect-video` / `16:9` sculptural stage) |
| `/images/labs-prism.jpg` | `1376×768` (`16:9`) | Precision stacked smoked optical glass and bead-blasted matte obsidian monoliths with a hairline warm vermilion internal light line on `#08080A` | Labs (`/labs`) catalog visual anchor & Home Labs showcase |
| `/images/skunkworks-forge.jpg` | `1376×768` (`16:9`) | Macro CNC-milled matte black aerospace alloy mechanism and gearwork around a frosted optical glass aperture with warm amber-vermilion inner reflection | Skunkworks (`/skunkworks`) & Systems (`/systems`) hardware craft visual anchor |
| `/images/orbit-atelier.jpg` | `1376×768` (`16:9`) | Quiet monolithic dark board-formed concrete and smoked glass studio interior at twilight with warm focused overhead light on a basalt worktable | Orbit (`/orbit`) studio atmosphere & Home Manifesto band |

**Image Treatment Rules:** Render imagery cleanly inside `rounded-2xl` (`16px`) `aspect-video` (`16:9`) containers with `overflow-hidden`, `object-cover`, and a subtle inset hairline catch (`ring-1 ring-inset ring-white/[0.08]`), or blend seamlessly into `#08080A` via soft edge gradient masks in the Hero. Never place floating corner badges, `Plate 01` pills, category stamps, or photo-credit captions on top of images.

## Elevation & Depth

Depth is communicated through **two distinct, non-overlapping layers**: tonal surface stepping for static page content and frosted translucent chrome for floating controls.

- **Tonal Layering (Page Content):** Static cards and panels sit on `#111114` against `#08080A` with a single `1px solid rgba(255, 255, 255, 0.07)` edge (`.surface-card`). On hover (fine pointers only), surface lifts softly to `#16161A` / `#18181D` with border luminance stepping to `rgba(255, 255, 255, 0.14)`. Declare elevation once: never pair a visible border with a wide muddy drop shadow ("ghost card").
- **Floating Frosted Glass Chrome (`.glass-chrome`):** Honest web frosted-glass approximation inspired by Apple materials (explicitly a CSS `backdrop-filter` approximation, not official Apple platform Liquid Glass). Used exclusively for floating chrome that rides above scrolling content: Navbar pill, mobile menu panel, CommandPalette (`⌘K`), ScopeDrawer, and sticky filter bars.
  - Background: `rgba(14, 14, 18, 0.72)`
  - Backdrop: `backdrop-filter: blur(20px) saturate(180%)`
  - Border: `1px solid rgba(255, 255, 255, 0.09)`
  - Specular top catch + separation shadow: `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 16px 40px rgba(0, 0, 0, 0.45)`
  - Accessibility fallbacks: `@media (prefers-reduced-transparency: reduce)` switches to solid `#111114` with `backdrop-filter: none`; `@media (prefers-contrast: more)` raises surface opacity and border luminance.
- **Scroll Edge Vignette:** `ArchitecturalShell` applies a soft top gradient scrim beneath the floating navbar so scrolling content glides cleanly underneath without a hard sticky dividing line.
- **Modal Scrims:** Blocking overlays (CommandPalette, ScopeDrawer, Hackathon Submit modal) pair a soft dimming scrim (`bg-black/65 backdrop-blur-sm`) with floating `.glass-chrome` surfaces. Never stack one translucent surface directly over another translucent surface.

### Motion & Interaction Physics (`lib/motion.ts` & `app/globals.css`)

All motion adheres to Apple Fluid Interfaces and Emil Kowalski design engineering rules:

- **Default UI Spring (`SPRING_UI`):** `{ type: "spring", duration: 0.4, bounce: 0 }` (critically damped, zero overshoot). Used for active nav pills (`layoutId`), tab indicators, interactive division switches, and filter states.
- **Sheet & Drawer Spring (`SPRING_SHEET`):** `{ type: "spring", duration: 0.36, bounce: 0.1 }`. Used for `ScopeDrawer` and modal sheets with symmetric enter and exit paths (slide in from right, exit to right).
- **Custom Easing Tokens:** `--ease-out-expo: cubic-bezier(0.23, 1, 0.32, 1)` for entrances/reveals, `--ease-in-out-smooth: cubic-bezier(0.77, 0, 0.175, 1)` for on-screen morphs, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` for drawers. Never use `ease-in` on UI transitions.
- **Tactile Press Feedback:** Every pressable button, CTA, and chip responds on pointer-down via `:active { transform: scale(0.97); }` (`120ms–160ms ease-out`).
- **Keyboard-Instant Rule:** Keyboard-triggered Command Palette (`⌘K`) opens and closes with **zero animation** (instant snap) so repeated power-user access never feels delayed.
- **Scroll Reveals (`Reveal`, `StaggerGroup`, `StaggerItem`):** Enter gently from `opacity: 0, y: 14` (never `scale(0)`), `viewport={{ once: true, margin: "-80px" }}`, short stagger (`30–60ms`), never blocking pointer input.
- **Pointer Physics:** `MagneticButton` and `GravityFieldCanvas` run strictly via Framer Motion `useMotionValue` + `useSpring` or `requestAnimationFrame` (zero React `useState` updates per pointer move), gated to `@media (hover: hover) and (pointer: fine)`.
- **Reduced Motion:** Global `@media (prefers-reduced-motion: reduce)` and `useReducedMotion()` replace spatial motion, springs, and canvas movement with short opacity transitions or static states.
- **Browser Surfaces:** Themed `::selection` (`#FF3B1F` background, `#08080A` text), subtle obsidian custom scrollbar, crisp `focus-visible` outline (`2px solid #FF3B1F`, `outline-offset: 2px`).

### Named Rules

**The Single-Layer Translucency Rule.** Only floating chrome uses `.glass-chrome`. Content cards use solid tonal `.surface-card` (`#111114`). Never stack frosted glass over frosted glass.

**The Instant-Keyboard Rule.** Actions triggered via keyboard shortcuts (`⌘K` Command Palette, Escape dismissal) never wait on entrance animations.

## Shapes

A locked 3-tier soft-sculptural corner hierarchy that eliminates all boxy 0px geometry while maintaining crisp precision across every route:

- **Full Pill (`rounded-full` / `9999px`):** Primary and secondary CTA buttons, desktop floating Navbar container, active navigation indicator pill, filter chips, segmented switches (USD/NGN, Grid/Table), and compact status/source badges.
- **Soft Sculpted (`rounded-2xl` / `16px`):** Elevated content cards (`.surface-card`), editorial photography frames, CommandPalette container, mobile floating navigation panel, and modals (`rounded-l-3xl` / `24px` or floating `rounded-2xl` for desktop `ScopeDrawer`).
- **Compact Control (`rounded-xl` / `12px`):** Text inputs, selects, textareas, CommandPalette result rows, and compact icon buttons; `rounded-lg` (`8px`) for the `32px` geometric `GG` monogram stamp.

### Named Rules

**The Shape Consistency Lock.** Every interactive button and chip is a full pill (`rounded-full`); every card, modal, and media frame is `rounded-2xl` (`16px`); every input and compact row is `rounded-xl` (`12px`). Sharp `0px` containers, `border-x` outer page cages, `+` corner crosshairs, and thick colored `border-l-2` callout bars are banned site-wide.

## Components

### Navigation (`Navbar.tsx`, `StretchedWordmark.tsx`, `ArchitecturalShell.tsx`)
Floating translucent pill bar anchored at `top-3` (`max-w-[1360px]`, height `56px`–`64px`, `.glass-chrome`, `rounded-full` on desktop), gliding above a soft top scroll-edge vignette.
- **Left:** Refined `GG` monogram (`rounded-lg`) + clean kinetic `G Gravitator` wordmark (animated horizontal vector hairline stretch on hover, no em-dash text).
- **Center (Single Line at `lg`):** `Systems`, `Labs`, `Skunkworks`, `Hackathons` (with subtle live numeric pill), `Journal`, `Orbit`. Active route highlights with a soft pill sliding via `layoutId="nav-active-pill"` (`SPRING_UI`).
- **Right:** `⌘K` Command Palette trigger (`id="nav-cmd-k-trigger"`) and single-line `Initiate build` primary CTA (`id="nav-initiate-build-btn"`). Zero `SYS: NOMINAL` telemetry badge.
- **Mobile (`<lg`):** Translucent floating `rounded-2xl` dropdown panel with comfortable vertical rows (`min-h-[44px]`), never a cramped 2-column boxed grid.

### Buttons & CTAs
Tactile, single-line (`whitespace-nowrap`), full-pill (`rounded-full`) controls with instant press response (`active:scale-[0.97]`).
- **Primary:** `#FF3B1F` background, `#08080A` obsidian text (`font-medium`), `px-5 py-2.5` or `px-6 py-3`, hover `#FF5238`.
- **Secondary:** `#18181D` background, `#F4F3EF` text, `border border-white/[0.10]`, hover `bg-white/[0.10] border-white/[0.18]`.
- **Ghost / Text Link:** `#F4F3EF` or `#A1A1AA` text transitioning cleanly to `#F4F3EF` with subtle directional icon shift (`translate-x-0.5` on fine-pointer hover).
- **Consistent CTA Intent:** Use one canonical verb per intent across a page (e.g., `Initiate build` consistently triggers the Scope Drawer; never mix "Start a project", "Let's talk", and "Get in touch" on the same page).

### Filter Chips & Segmented Controls
- **Unselected Chip:** `rounded-full`, `#111114` fill, `border border-white/[0.08]`, `#A1A1AA` text, hover `#18181D` + `#F4F3EF` text.
- **Selected Chip:** `rounded-full`, `#F4F3EF` fill with `#08080A` text (or `bg-[#FF3B1F]/15 text-[#FF6B54] border-[#FF3B1F]/35` for urgent/featured filters).
- **Segmented Toggles (USD/NGN, Grid/Table):** Recessed `#111114` `rounded-full` track with `p-1` and sliding pill active thumb using `SPRING_UI`.

### Cards & Surface Containers (`.surface-card`)
Use cards strictly when elevation or interactive grouping communicates hierarchy; otherwise let copy and lists breathe openly with negative space or subtle horizontal hairlines.
- **Geometry:** `rounded-2xl` (`16px`), `#111114` fill, `border border-white/[0.07]`, generous padding (`p-6` to `p-8`).
- **No Nested Cards:** Never stack bordered cards inside bordered cards inside cards; use subtle typographic separation or quiet hairline dividers internally.
- **Interactive Hover:** Gated to fine pointers (`@media (hover: hover) and (pointer: fine)`): subtle surface step to `#16161A` and border lift to `rgba(255, 255, 255, 0.14)`.

### Inputs & Forms (`ScopeDrawer.tsx`, `/systems`, `/orbit`, `Footer.tsx`, `NewsletterBar.tsx`)
- **Label Placement:** Explicit visible `<label>` directly above every input (`gap-2`), `#F4F3EF` or `#D4D4D8` text (`text-sm font-medium`). Never placeholder-as-label.
- **Field Styling:** `rounded-xl` (`12px`), `#111114` or `#0E0E12` fill, `border border-white/[0.12]`, `#F4F3EF` text, `#8B8B94` placeholder (WCAG AA compliant).
- **Focus & Validation:** Focus transitions border to `#FF3B1F` with crisp `ring-2 ring-[#FF3B1F]/30`; inline errors render below the field in legible high-contrast coral-red (`#FF6B54`) with clear recovery instructions.

### Signature Interactive Components
- **Command Palette (`CommandPalette.tsx`):** Floating `.glass-chrome` `rounded-2xl` search dialog, zero open/close animation, `rounded-xl` active selection rows, full keyboard navigation (`↑`/`↓`/`Enter`/`Esc`), preserving `/api/search` and quick actions.
- **Scope Drawer (`ScopeDrawer.tsx`):** Right-anchored floating sheet (`m-3 rounded-2xl` on desktop or `rounded-l-3xl`) animated via `SPRING_SHEET`, symmetric slide-in/out from right, Escape close, dimming scrim, preserving `gg:open-scope-drawer` and `/api/inquiries`.
- **Gravity Field Canvas (`GravityFieldCanvas.tsx`):** Atmospheric deep-space orbital arcs and subtle luminous nodes that bend smoothly toward cursor velocity via `requestAnimationFrame` and fade seamlessly into `#08080A` with zero box edges.
- **Flywheel Interactive Stage (`FlywheelMatrix.tsx`):** Sculptural interactive showcase of the four divisions (Systems, Labs, Skunkworks, Orbit) with spring-animated active selection and spacious detail stage linking to each division route.
- **Graduation Scorecard (`GraduationScorecard.tsx`):** Tactile 5-metric interactive evaluator on `/skunkworks` using smooth custom range controls, tabular score display (`XX/25`), and clear verdict callout without noisy boxed cells.

## Do's and Don'ts

### Do:
- **Do** use sentence-case `Bricolage Grotesque` for all display and section headings (`tracking: -0.025em` to `-0.03em`, `leading: 1.04–1.08`, `text-wrap: balance`).
- **Do** pair `#FF3B1F` filled pills with `#08080A` dark ink so every primary CTA passes WCAG AA (≥5.6:1).
- **Do** use `Geist Mono` with `tabular-nums` strictly for real live telemetry (countdowns, prize figures, drop codes `G-01`..`G-04`, `⌘K`, code blocks).
- **Do** preserve every existing route slug, API endpoint, custom window event (`gg:open-scope-drawer`), and DOM element `id` required by interactive chrome and tests.
- **Do** frame all 4 studio photographs (`/images/*.jpg`, `1376×768`, `16:9`) cleanly inside `rounded-2xl` containers with `object-cover` and zero overlaid pills or captions.
- **Do** gate pointer-hover lifts and magnetic pulls to `@media (hover: hover) and (pointer: fine)` and honor `prefers-reduced-motion` and `prefers-reduced-transparency`.
- **Do** declare explicit `<768px` responsive collapse rules on every multi-column grid and keep all desktop CTAs and navigation links single-line (`whitespace-nowrap`).
- **Do** implement complete loading skeletons, clear empty states, and inline error recovery on every data-backed and form surface.

### Don't:
- **Don't** place kickers or eyebrows (small uppercase tracked labels) above section headings anywhere on the site. Let the heading carry its own weight.
- **Don't** prefix sections, cards, or footer columns with numbering strings like `01 //`, `02 //`, `MODULE 01 //`, or `PATHWAY 01 //`.
- **Don't** use em-dashes (`—`) anywhere in visible copy, headings, labels, pills, quotes, buttons, or alt text. Use periods, commas, colons, or parentheses instead.
- **Don't** use the split-header pattern ("left big headline + right floating small explainer paragraph"). Stack section headline and subtext vertically (`max-w-[65ch]`).
- **Don't** wrap pages in outer `border-x` vertical cages, build `divide-x/divide-y` boxed spreadsheet grids, render `0px` sharp boxes, place `+` crosshair markers, or attach colored `border-l-2` bars to cards.
- **Don't** display fake telemetry badges (`SYS: NOMINAL`), decorative status dots, UTC/WAT clock strips, scroll cues (`↓ scroll`), or version labels in hero sections.
- **Don't** render div-based fake product screenshots, hand-rolled decorative SVG illustrations, gradient text, or AI purple/cyan glows.
- **Don't** animate `scale(0)` entrances, animate keyboard-triggered `⌘K` open/close, use `ease-in` on UI transitions, or store pointer coordinates in React `useState`.
