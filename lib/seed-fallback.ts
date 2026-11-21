import type {
  ClientInquiry,
  Dispatch,
  Hackathon,
  LabProject,
  NewsItem,
  NewsletterSubscriber,
  OrbitApplication,
} from "@/lib/supabase/types";

const NOW = Date.now();
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

function futureIso(msOffset: number): string {
  return new Date(NOW + msOffset).toISOString();
}

function pastIso(msOffset: number): string {
  return new Date(NOW - msOffset).toISOString();
}

export const SEED_LAB_PROJECTS: LabProject[] = [
  // =========================================================================
  // DIVISION 1: G-GRAVITATOR LABS (NUMBERED COMMERCIAL DROPS G-01 .. G-04)
  // =========================================================================
  {
    id: "lab-g01",
    code: "G-01",
    division: "LABS",
    name: "GRAVITY DECK",
    slug: "gravity-deck",
    tagline:
      "AI interactive pitch & launch studio converting founder notes and architecture docs into kinetic web micro-sites.",
    description:
      "Static PDF decks die in partner inboxes. Gravity Deck ingests raw technical specs, repository READMEs, and financial models to compile live, password-gated kinetic micro-sites with interactive system diagrams, live telemetry blocks, and per-investor engagement heatmaps.",
    thesis:
      "Technical founders lose narrative momentum translating architectural depth into flat slides. Graduated from OXAKALABS's OXA-01 (DEMOPILOT) hackathon prototype after scoring 23/25 on the Graduation Filter, Gravity Deck treats a fundraising or enterprise sales narrative as an executable software artifact.",
    architecture_notes: [
      "AST & Markdown Ingestion Engine: Parses repository trees, OpenAPI specs, and founder briefs into structured narrative blocks.",
      "Kinetic Layout Compiler: Maps narrative blocks onto a deterministic 12-column Swiss editorial grid with Framer Motion spring physics.",
      "Telemetry Gate & Investor Beacon: Edge-middleware token authentication tracking section dwell time and interactive sandbox triggers.",
    ],
    changelog: [
      {
        version: "v0.4.2-proto",
        date: "2026-11-14",
        summary: "Added live GitHub repository tree ingestion and interactive Mermaid/SVG architecture block compiler.",
      },
      {
        version: "v0.3.0-proto",
        date: "2026-10-28",
        summary: "Implemented Kinetic Luxury 1px grid renderer and per-link investor telemetry beacon.",
      },
      {
        version: "v0.1.0-oxa",
        date: "2026-10-10",
        summary: "Graduated from OXAKALABS // Skunkworks (DEMOPILOT build, 23/25 Graduation Score).",
      },
    ],
    status: "PROTOTYPING",
    tech_stack: ["Next.js 15", "TypeScript", "Gemini 2.5 Flash", "Framer Motion", "Supabase Edge"],
    live_url: "https://github.com/Aka4real/DEMOPILOT",
    repo_url: "https://github.com/Aka4real/DEMOPILOT",
    hackathon_origin: "Graduated from OXA-01 // DEMOPILOT (23/25 Score)",
    scorecard: {
      pain_intensity: 5,
      willingness_to_pay: 5,
      technical_moat: 4,
      distribution_hook: 5,
      lean_maintainability: 4,
    },
    sort_order: 1,
    created_at: pastIso(30 * DAY),
  },
  {
    id: "lab-g02",
    code: "G-02",
    division: "LABS",
    name: "OPSPILOT",
    slug: "opspilot",
    tagline:
      "Autonomous WhatsApp, email, and dashboard operations agent for high-volume SMEs (intake, quoting, invoicing, daily briefs).",
    description:
      "High-volume regional and global SMEs run their entire revenue loop over fragmented WhatsApp threads, email attachments, and spreadsheets. OpsPilot deploys a deterministic multi-agent operations kernel that triages client messages, drafts structured quotes, reconciles ledger entries, and delivers a 07:00 UTC executive telemetry brief.",
    thesis:
      "Enterprise ERPs are too heavy for 10-to-100 person operators, while generic chatbots hallucinate pricing. OpsPilot pairs strict schema-validated tool calling with human-in-the-loop approval gates over WhatsApp Business API and web command rails.",
    architecture_notes: [
      "Omnichannel Ingress Router: Normalizes WhatsApp Cloud API webhooks, IMAP/Gmail threads, and web intake forms into a unified state machine.",
      "Deterministic Quoting Engine: Enforces strict inventory and margin rules via Zod-validated tool schemas before generating PDF/Paystack/Stripe payment links.",
      "Executive Morning Wire: Automated cron synthesizer delivering daily cashflow, SLA bottleneck, and pending-approval summaries.",
    ],
    changelog: [
      {
        version: "v0.2.1-rnd",
        date: "2026-11-11",
        summary: "Added multi-currency USD/NGN ledger reconciliation and WhatsApp interactive approval buttons.",
      },
      {
        version: "v0.1.0-rnd",
        date: "2026-10-19",
        summary: "Core multi-agent state machine extracted from Nexus Retail Operations Suite R&D.",
      },
    ],
    status: "R&D",
    tech_stack: ["TypeScript", "Node.js", "WhatsApp Cloud API", "Gemini Flash", "PostgreSQL", "Redis"],
    live_url: null,
    repo_url: "https://github.com/Aka4real/stitch-retail-operations-management-suite",
    hackathon_origin: "Informed by OXA-02 // Nexus Retail Operations Suite",
    scorecard: {
      pain_intensity: 5,
      willingness_to_pay: 5,
      technical_moat: 4,
      distribution_hook: 4,
      lean_maintainability: 4,
    },
    sort_order: 2,
    created_at: pastIso(25 * DAY),
  },
  {
    id: "lab-g03",
    code: "G-03",
    division: "LABS",
    name: "KINETIC STUDIO",
    slug: "kinetic-studio",
    tagline:
      "Browser-based AI brand & motion asset lab turning product URLs and screenshots into minimalist-luxury launch teasers.",
    description:
      "Engineers ship flagship features with zero visual gravity because motion design agencies charge $15,000 and take six weeks. Kinetic Studio scrapes a live product URL or DOM tree, extracts typography and component geometry, and renders 60fps spring-physics launch videos and interactive social cards in the browser.",
    thesis:
      "Distribution rewards high-mass visual craft. By codifying Porsche Design / Teenage Engineering motion curves into parameterized WebGL and Canvas scenes, Kinetic Studio gives solo builders industrial-grade launch telemetry in 90 seconds.",
    architecture_notes: [
      "DOM & Token Extractor: Headless browser pipeline capturing computed CSS variables, SVG marks, and layout bounding boxes.",
      "Parameterized Spring Sequencer: Deterministic timeline engine driven by physical mass, stiffness, and damping curves.",
      "WebCodecs 60fps Exporter: Client-side MP4/WebM frame encoder with zero server GPU rendering cost.",
    ],
    changelog: [
      {
        version: "v0.1.0-concept",
        date: "2026-11-05",
        summary: "Completed spring-physics timeline schema and WebCodecs deterministic frame capture prototype.",
      },
    ],
    status: "CONCEPT",
    tech_stack: ["WebCodecs API", "HTML5 Canvas", "Framer Motion", "Next.js", "Tailwind CSS v4"],
    live_url: null,
    repo_url: null,
    hackathon_origin: "Internal G-Gravitator Design Engineering Spec",
    scorecard: {
      pain_intensity: 4,
      willingness_to_pay: 4,
      technical_moat: 5,
      distribution_hook: 5,
      lean_maintainability: 4,
    },
    sort_order: 3,
    created_at: pastIso(20 * DAY),
  },
  {
    id: "lab-g04",
    code: "G-04",
    division: "LABS",
    name: "ORBITBENCH",
    slug: "orbitbench",
    tagline:
      "Multi-agent prompt & workflow evaluation workbench for side-by-side LLM latency, schema adherence, and cost benchmarking.",
    description:
      "Production AI systems fail silently when prompt edits break downstream JSON schemas or triple token latency. OrbitBench runs parallel regression suites across Gemini, Claude, OpenAI, and open-weight models, scoring strict JSON Schema compliance, tool-call determinism, time-to-first-token, and cost-per-1k runs.",
    thesis:
      "Born directly inside OXAKALABS while debugging multi-agent hackathon harnesses under 48-hour pressure, OrbitBench replaces vibes-based prompt tweaking with repeatable engineering telemetry.",
    architecture_notes: [
      "Parallel Model Harness: Concurrent execution runner with unified token, latency, and cost accounting across 6 model providers.",
      "Strict Zod/JSON-Schema Diffing: Highlights exact field-level structural drift and hallucinated keys across 100+ test fixtures.",
      "CI/CD GitHub Action Gate: Blocks pull requests when schema compliance drops below 99.5% or p95 latency spikes.",
    ],
    changelog: [
      {
        version: "v0.2.0-skunkworks",
        date: "2026-11-16",
        summary: "Benchmarked Gemini 2.5 Flash structured outputs against multi-provider hackathon extraction fixtures.",
      },
    ],
    status: "SKUNKWORKS CANDIDATE",
    tech_stack: ["TypeScript", "@google/genai", "Zod", "Next.js", "Vitest"],
    live_url: "https://github.com/Aka4real/All-Things-Agentic-Hackathon",
    repo_url: "https://github.com/Aka4real/All-Things-Agentic-Hackathon",
    hackathon_origin: "Born in OXA-03 // All-Things-Agentic Hackathon",
    scorecard: {
      pain_intensity: 5,
      willingness_to_pay: 4,
      technical_moat: 4,
      distribution_hook: 4,
      lean_maintainability: 5,
    },
    sort_order: 4,
    created_at: pastIso(15 * DAY),
  },

  // =========================================================================
  // DIVISION 2: OXAKALABS // SKUNKWORKS (AUTHENTIC GITHUB BUILDS OXA-01..06)
  // =========================================================================
  {
    id: "oxa-01",
    code: "OXA-01",
    division: "SKUNKWORKS",
    name: "DEMOPILOT",
    slug: "demopilot",
    tagline:
      "Autonomous demo engineering & interactive product walkthrough synthesis engine built for high-stakes technical launches.",
    description:
      "Built in a 48-hour OXAKALABS sprint to eliminate dead demo videos during hackathon judging and founder pitches. DEMOPILOT synthesizes live product states, voiceover telemetry, and guided interactive DOM walkthroughs—graduating directly into G-01 // GRAVITY DECK.",
    status: "LIVE",
    tech_stack: ["TypeScript", "Next.js", "AI Agents", "DOM Telemetry", "Framer Motion"],
    live_url: "https://github.com/Aka4real/DEMOPILOT",
    repo_url: "https://github.com/Aka4real/DEMOPILOT",
    hackathon_origin: "OXAKALABS 48-Hour Flagship Build → Promoted to Labs G-01",
    scorecard: {
      pain_intensity: 5,
      willingness_to_pay: 5,
      technical_moat: 4,
      distribution_hook: 5,
      lean_maintainability: 4,
    },
    sort_order: 10,
    created_at: pastIso(41 * DAY),
  },
  {
    id: "oxa-02",
    code: "OXA-02",
    division: "SKUNKWORKS",
    name: "NEXUS RETAIL OPERATIONS SUITE",
    slug: "nexus-retail-operations-suite",
    tagline:
      "Multi-tier RBAC retail operations management suite engineered with Google Stitch design tokens and Emil Kowalski motion craft.",
    description:
      "Full-spectrum enterprise retail command center uniting inventory velocity tracking, role-based access clearance (RBAC), audit logs, and micro-interaction precision. Serves as the foundational B2B reference architecture for G-Gravitator Systems and G-02 // OPSPILOT.",
    status: "LIVE",
    tech_stack: ["TypeScript", "React", "Google Stitch Tokens", "RBAC Architecture", "Kinetic UI"],
    live_url: "https://github.com/Aka4real/stitch-retail-operations-management-suite",
    repo_url: "https://github.com/Aka4real/stitch-retail-operations-management-suite",
    hackathon_origin: "OXAKALABS Enterprise Design Engineering Sprint",
    scorecard: {
      pain_intensity: 5,
      willingness_to_pay: 5,
      technical_moat: 4,
      distribution_hook: 3,
      lean_maintainability: 4,
    },
    sort_order: 11,
    created_at: pastIso(65 * DAY),
  },
  {
    id: "oxa-03",
    code: "OXA-03",
    division: "SKUNKWORKS",
    name: "ALL-THINGS-AGENTIC HARNESS",
    slug: "all-things-agentic-harness",
    tagline:
      "Multi-agent autonomous orchestration, tool-verification, and execution telemetry harness built for the All-Things-Agentic Hackathon.",
    description:
      "Coordinates specialized planner, researcher, and verifier agents over deterministic JSON contracts with automatic rollback when tool outputs violate safety or schema thresholds. Direct precursor to G-04 // ORBITBENCH.",
    status: "LIVE",
    tech_stack: ["Multi-Agent Systems", "TypeScript", "Tool Calling", "JSON Schema", "LLM Eval"],
    live_url: "https://github.com/Aka4real/All-Things-Agentic-Hackathon",
    repo_url: "https://github.com/Aka4real/All-Things-Agentic-Hackathon",
    hackathon_origin: "All-Things-Agentic Global AI Hackathon",
    scorecard: {
      pain_intensity: 5,
      willingness_to_pay: 4,
      technical_moat: 5,
      distribution_hook: 4,
      lean_maintainability: 4,
    },
    sort_order: 12,
    created_at: pastIso(70 * DAY),
  },
  {
    id: "oxa-04",
    code: "OXA-04",
    division: "SKUNKWORKS",
    name: "AIFY CYCLE",
    slug: "aify-cycle",
    tagline:
      "Cyclic AI workflow automation engine converting recurring operational bottlenecks into self-verifying background loops.",
    description:
      "Designed for lean engineering teams to wire trigger-evaluate-act loops across webhooks, repositories, and operational databases without brittle DAG boilerplate.",
    status: "BETA",
    tech_stack: ["TypeScript", "Next.js", "Workflow Engine", "Webhooks", "Autonomous Loops"],
    live_url: "https://github.com/Aka4real/aify-cycle",
    repo_url: "https://github.com/Aka4real/aify-cycle",
    hackathon_origin: "OXAKALABS Automation Sprint",
    scorecard: {
      pain_intensity: 4,
      willingness_to_pay: 4,
      technical_moat: 4,
      distribution_hook: 3,
      lean_maintainability: 4,
    },
    sort_order: 13,
    created_at: pastIso(38 * DAY),
  },
  {
    id: "oxa-05",
    code: "OXA-05",
    division: "SKUNKWORKS",
    name: "AI-API-ATP // AUTONOMOUS API AGENT",
    slug: "ai-api-atp",
    tagline:
      "Autonomous API discovery, endpoint probing, and typed tool-wrapper synthesis agent.",
    description:
      "Point AI-API-ATP at raw documentation or an unfamiliar REST endpoint and it maps authentication headers, infers payload schemas, and emits verified TypeScript/MCP tool definitions ready for agent consumption.",
    status: "PROTOTYPING",
    tech_stack: ["AI Agents", "OpenAPI Synthesis", "TypeScript", "MCP Tooling"],
    live_url: "https://github.com/Aka4real/ai-api-atp",
    repo_url: "https://github.com/Aka4real/ai-api-atp",
    hackathon_origin: "OXAKALABS Tooling Experiment",
    scorecard: {
      pain_intensity: 4,
      willingness_to_pay: 4,
      technical_moat: 4,
      distribution_hook: 4,
      lean_maintainability: 4,
    },
    sort_order: 14,
    created_at: pastIso(90 * DAY),
  },
  {
    id: "oxa-06",
    code: "OXA-06",
    division: "SKUNKWORKS",
    name: "SOLANA TOKEN LAUNCH FORGE",
    slug: "solana-token-launcher",
    tagline:
      "Zero-friction SPL token deployment, metadata pinning, and on-chain liquidity telemetry console.",
    description:
      "Rapid Web3 protocol experiment automating SPL mint authority configuration, IPFS metadata registration, and real-time transaction verification on Solana devnet/mainnet.",
    status: "ARCHIVED",
    tech_stack: ["Solana Web3.js", "SPL Token", "TypeScript", "React", "Wallet Adapter"],
    live_url: "https://github.com/Aka4real/solana-token-launcher",
    repo_url: "https://github.com/Aka4real/solana-token-launcher",
    hackathon_origin: "Web3 Rapid Protocol Sprint (B2B Case Study & Open Source)",
    scorecard: {
      pain_intensity: 3,
      willingness_to_pay: 4,
      technical_moat: 3,
      distribution_hook: 3,
      lean_maintainability: 3,
    },
    sort_order: 15,
    created_at: pastIso(75 * DAY),
  },
];

export const SEED_HACKATHONS: Hackathon[] = [
  {
    id: "hack-01",
    fingerprint: "google-gemini-agentic-buildathon-2026-11",
    title: "Gemini Multi-Agent & MCP Frontier Buildathon",
    slug: "gemini-multi-agent-mcp-frontier-buildathon",
    organizer: "Google DeepMind & Devpost",
    summary:
      "Engineer production multi-agent systems, structured tool-calling pipelines, and real-time multimodal applications powered by Gemini 2.5 Flash and Pro.",
    prize_pool_usd: 100000,
    prize_display: "$100,000 + $50k Cloud Credits",
    start_at: pastIso(5 * DAY),
    deadline_at: futureIso(34 * HOUR), // < 48H -> triggers Ion Signal #FF3B1F urgent countdown!
    format: "ONLINE",
    location: "Global / Remote",
    themes: ["AI", "Agents", "Open Source", "SaaS / Web"],
    sources: [
      { provider: "devpost", url: "https://devpost.com/hackathons" },
      { provider: "twitter", url: "https://x.com/GoogleAI/status/189001020304050607" },
    ],
    primary_url: "https://devpost.com/hackathons",
    source_tweet_url: "https://x.com/GoogleAI/status/189001020304050607",
    oxakalabs_status: "SQUAD_DEPLOYED",
    confidence_score: 0.99,
    is_published: true,
    is_featured: true,
    created_at: pastIso(6 * DAY),
    updated_at: pastIso(1 * HOUR),
  },
  {
    id: "hack-02",
    fingerprint: "cerebral-valley-autonomous-agents-jam-2026-11",
    title: "Cerebral Valley × Anthropic Autonomous Systems Sprint",
    slug: "cerebral-valley-anthropic-autonomous-systems-sprint",
    organizer: "Cerebral Valley & Anthropic",
    summary:
      "48-hour high-density builder sprint focused on computer-use agents, deterministic code verification, and zero-latency developer workflows. Announced directly via X prior to public aggregator indexing.",
    prize_pool_usd: 65000,
    prize_display: "$65,000 + API Compute Grants",
    start_at: pastIso(1 * DAY),
    deadline_at: futureIso(44 * HOUR), // < 48H -> Ion Signal #FF3B1F!
    format: "HYBRID",
    location: "San Francisco & Global Remote",
    themes: ["AI", "Agents", "SaaS / Web"],
    sources: [
      { provider: "twitter", url: "https://x.com/cerebral_valley/status/189009887766554433" },
      { provider: "luma", url: "https://lu.ma/cerebralvalley" },
    ],
    primary_url: "https://lu.ma/cerebralvalley",
    source_tweet_url: "https://x.com/cerebral_valley/status/189009887766554433",
    oxakalabs_status: "SCOUTING",
    confidence_score: 0.96,
    is_published: true,
    is_featured: true,
    created_at: pastIso(2 * DAY),
    updated_at: pastIso(45 * 60 * 1000),
  },
  {
    id: "hack-03",
    fingerprint: "dorahacks-sovereign-ai-infra-bounty-2026-11",
    title: "DoraHacks Global Decentralized AI & Verifiable Compute Grant",
    slug: "dorahacks-global-decentralized-ai-verifiable-compute",
    organizer: "DoraHacks",
    summary:
      "Build verifiable inference pipelines, cryptographic agent identity standards, and autonomous on-chain treasury execution engines.",
    prize_pool_usd: 150000,
    prize_display: "$150,000 USDC Bounty Pool",
    start_at: pastIso(10 * DAY),
    deadline_at: futureIso(4 * DAY + 11 * HOUR),
    format: "ONLINE",
    location: "Global / Remote",
    themes: ["AI", "Agents", "Web3", "Open Source"],
    sources: [
      { provider: "dorahacks", url: "https://dorahacks.io/bugbounty" },
      { provider: "twitter", url: "https://x.com/DoraHacks/status/189002334455667788" },
    ],
    primary_url: "https://dorahacks.io/hackathons",
    source_tweet_url: "https://x.com/DoraHacks/status/189002334455667788",
    oxakalabs_status: "SCOUTING",
    confidence_score: 0.95,
    is_published: true,
    is_featured: true,
    created_at: pastIso(7 * DAY),
    updated_at: pastIso(2 * HOUR),
  },
  {
    id: "hack-04",
    fingerprint: "vercel-supabase-ai-ship-week-hackathon-2026-11",
    title: "Vercel × Supabase Edge AI & Realtime Agents Challenge",
    slug: "vercel-supabase-edge-ai-realtime-agents-challenge",
    organizer: "Vercel & Supabase",
    summary:
      "Ship full-stack Next.js App Router applications pairing pgvector hybrid semantic search, background queues, and sub-50ms streaming agent interfaces.",
    prize_pool_usd: 45000,
    prize_display: "$45,000 + Pro Team Credits",
    start_at: pastIso(3 * DAY),
    deadline_at: futureIso(6 * DAY + 8 * HOUR),
    format: "ONLINE",
    location: "Global / Remote",
    themes: ["AI", "Agents", "SaaS / Web", "Open Source"],
    sources: [
      { provider: "twitter", url: "https://x.com/supabase/status/189003445566778899" },
    ],
    primary_url: "https://supabase.com/blog",
    source_tweet_url: "https://x.com/supabase/status/189003445566778899",
    oxakalabs_status: "SQUAD_DEPLOYED",
    confidence_score: 0.94,
    is_published: true,
    is_featured: true,
    created_at: pastIso(3 * DAY),
    updated_at: pastIso(30 * 60 * 1000),
  },
  {
    id: "hack-05",
    fingerprint: "lablab-nextgen-voice-multimodal-agents-2026-11",
    title: "Lablab.ai Realtime Multimodal & Voice Operations Sprint",
    slug: "lablab-realtime-multimodal-voice-operations-sprint",
    organizer: "Lablab.ai",
    summary:
      "7-day global AI sprint focused on low-latency WebRTC voice agents, automated customer operations, and real-time visual telemetry.",
    prize_pool_usd: 30000,
    prize_display: "$30,000 + Compute Credits",
    start_at: pastIso(2 * DAY),
    deadline_at: futureIso(5 * DAY + 16 * HOUR),
    format: "ONLINE",
    location: "Global / Remote",
    themes: ["AI", "Agents", "SaaS / Web", "Fintech"],
    sources: [{ provider: "lablab", url: "https://lablab.ai/event" }],
    primary_url: "https://lablab.ai/event",
    source_tweet_url: null,
    oxakalabs_status: "SUBMITTED",
    confidence_score: 0.92,
    is_published: true,
    is_featured: false,
    created_at: pastIso(4 * DAY),
    updated_at: pastIso(3 * HOUR),
  },
  {
    id: "hack-06",
    fingerprint: "ethglobal-agentic-commerce-hack-2026-12",
    title: "ETHGlobal Autonomous Commerce & Programmable Payments",
    slug: "ethglobal-autonomous-commerce-programmable-payments",
    organizer: "ETHGlobal",
    summary:
      "Architect machine-to-machine stablecoin settlement protocols, autonomous procurement agents, and verifiable escrow rails.",
    prize_pool_usd: 250000,
    prize_display: "$250,000 Partner Protocol Pool",
    start_at: futureIso(2 * DAY),
    deadline_at: futureIso(9 * DAY + 4 * HOUR),
    format: "HYBRID",
    location: "London & Global Online",
    themes: ["Agents", "Web3", "Fintech"],
    sources: [
      { provider: "ethglobal", url: "https://ethglobal.com/events" },
      { provider: "twitter", url: "https://x.com/ETHGlobal/status/189004556677889900" },
    ],
    primary_url: "https://ethglobal.com/events",
    source_tweet_url: "https://x.com/ETHGlobal/status/189004556677889900",
    oxakalabs_status: "SCOUTING",
    confidence_score: 0.97,
    is_published: true,
    is_featured: false,
    created_at: pastIso(5 * DAY),
    updated_at: pastIso(2 * HOUR),
  },
  {
    id: "hack-07",
    fingerprint: "kaggle-arc-agi-reasoning-frontier-prize-2026-12",
    title: "Kaggle Program Synthesis & Neuro-Symbolic Reasoning Prize",
    slug: "kaggle-program-synthesis-neuro-symbolic-reasoning-prize",
    organizer: "Kaggle & Frontier Research Labs",
    summary:
      "Advance sample-efficient program synthesis and zero-shot abstract reasoning under strict compute and latency budgets.",
    prize_pool_usd: 125000,
    prize_display: "$125,000 Cash Prize",
    start_at: pastIso(14 * DAY),
    deadline_at: futureIso(18 * DAY + 6 * HOUR),
    format: "ONLINE",
    location: "Global / Remote",
    themes: ["AI", "Open Source"],
    sources: [{ provider: "kaggle", url: "https://www.kaggle.com/competitions" }],
    primary_url: "https://www.kaggle.com/competitions",
    source_tweet_url: null,
    oxakalabs_status: "NONE",
    confidence_score: 0.98,
    is_published: true,
    is_featured: false,
    created_at: pastIso(12 * DAY),
    updated_at: pastIso(5 * HOUR),
  },
  {
    id: "hack-08",
    fingerprint: "devfolio-emerging-markets-fintech-ai-build-2026-12",
    title: "Devfolio Pan-African & Global South Fintech + AI Operating Rails",
    slug: "devfolio-pan-african-global-south-fintech-ai-rails",
    organizer: "Devfolio & Regional Ecosystem Partners",
    summary:
      "Engineer cross-border SME settlement tools, WhatsApp-native commerce intelligence, and low-bandwidth clinical triage systems.",
    prize_pool_usd: 40000,
    prize_display: "$40,000 + Accelerator Fast-Track",
    start_at: pastIso(1 * DAY),
    deadline_at: futureIso(11 * DAY + 14 * HOUR),
    format: "HYBRID",
    location: "Lagos / Nairobi / Global Online",
    themes: ["AI", "Fintech", "HealthTech", "SaaS / Web"],
    sources: [
      { provider: "devfolio", url: "https://devfolio.co/hackathons" },
      { provider: "twitter", url: "https://x.com/devfolio/status/189005667788990011" },
    ],
    primary_url: "https://devfolio.co/hackathons",
    source_tweet_url: "https://x.com/devfolio/status/189005667788990011",
    oxakalabs_status: "SQUAD_DEPLOYED",
    confidence_score: 0.95,
    is_published: true,
    is_featured: false,
    created_at: pastIso(3 * DAY),
    updated_at: pastIso(1 * HOUR),
  },
  {
    id: "hack-09",
    fingerprint: "mlh-global-hack-week-ai-systems-2026-12",
    title: "MLH Global Hack Week: Applied AI & Developer Tooling Season",
    slug: "mlh-global-hack-week-applied-ai-developer-tooling",
    organizer: "Major League Hacking (MLH)",
    summary:
      "Week-long high-velocity engineering marathon shipping open-source CLI harnesses, compiler plugins, and multi-model developer sandboxes.",
    prize_pool_usd: 20000,
    prize_display: "$20,000 + Hardware & Fellowship Grants",
    start_at: futureIso(1 * DAY),
    deadline_at: futureIso(8 * DAY + 2 * HOUR),
    format: "ONLINE",
    location: "Global / Remote",
    themes: ["AI", "Open Source", "SaaS / Web"],
    sources: [{ provider: "mlh", url: "https://mlh.io/seasons/2026/events" }],
    primary_url: "https://mlh.io/seasons/2026/events",
    source_tweet_url: null,
    oxakalabs_status: "NONE",
    confidence_score: 0.93,
    is_published: true,
    is_featured: false,
    created_at: pastIso(6 * DAY),
    updated_at: pastIso(4 * HOUR),
  },
  {
    id: "hack-10",
    fingerprint: "unstop-industrial-robotics-edge-ai-challenge-2026-12",
    title: "Unstop Edge Silicon, Robotics & Embodied AI Grand Challenge",
    slug: "unstop-edge-silicon-robotics-embodied-ai-challenge",
    organizer: "Unstop & Industrial Foundry Consortium",
    summary:
      "Deploy quantized vision-language-action (VLA) models on constrained edge hardware for warehouse telemetry and automated quality inspection.",
    prize_pool_usd: 55000,
    prize_display: "$55,000 + Edge GPU DevKits",
    start_at: pastIso(4 * DAY),
    deadline_at: futureIso(15 * DAY + 9 * HOUR),
    format: "HYBRID",
    location: "Bengaluru / Global Remote",
    themes: ["AI", "Hardware", "Agents"],
    sources: [{ provider: "unstop", url: "https://unstop.com/hackathons" }],
    primary_url: "https://unstop.com/hackathons",
    source_tweet_url: null,
    oxakalabs_status: "SCOUTING",
    confidence_score: 0.91,
    is_published: true,
    is_featured: false,
    created_at: pastIso(5 * DAY),
    updated_at: pastIso(6 * HOUR),
  },
  // One pending moderation item in queue (0.76 confidence) so /admin has an immediate realistic item to review!
  {
    id: "hack-11",
    fingerprint: "x-stealth-mcp-browser-runtime-bounty-2026-11",
    title: "Stealth Browser Runtime & Local MCP Server Bounty Thread",
    slug: "stealth-browser-runtime-local-mcp-server-bounty",
    organizer: "OpenAI Devs & Indie Infrastructure Syndicate",
    summary:
      "72-hour weekend bounty discovered on X for zero-config local MCP servers bridging browser DOM context into IDE coding agents.",
    prize_pool_usd: 15000,
    prize_display: "$15,000 Instant USDC / Stripe Payout",
    start_at: pastIso(6 * HOUR),
    deadline_at: futureIso(66 * HOUR),
    format: "ONLINE",
    location: "Global / X Thread",
    themes: ["Agents", "Open Source", "SaaS / Web"],
    sources: [
      { provider: "twitter", url: "https://x.com/OpenAIDevs/status/189007778899001122" },
    ],
    primary_url: "https://x.com/OpenAIDevs/status/189007778899001122",
    source_tweet_url: "https://x.com/OpenAIDevs/status/189007778899001122",
    oxakalabs_status: "SCOUTING",
    confidence_score: 0.76,
    is_published: false, // Pending founder approval in /admin!
    is_featured: false,
    created_at: pastIso(2 * HOUR),
    updated_at: pastIso(2 * HOUR),
  },
];

export const SEED_NEWS_ITEMS: NewsItem[] = [
  {
    id: "news-01",
    url_hash: "deepmind-gemini-flash-structured-agent-loops-2026",
    title: "Gemini 2.5 Flash Sub-200ms Structured Schema Decoding & Parallel Tool Execution",
    source_name: "Google DeepMind",
    source_url: "https://deepmind.google/technologies/gemini/",
    category: "MODELS",
    gravity_take:
      "Constrained FSM schema decoding at sub-200ms time-to-first-token turns LLM normalization from an expensive background job into an inline request primitive. Builders can now replace brittle regex scrapers with deterministic JSON Schema extraction at <$0.04 per 1,000 ingestion runs.",
    impact_score: 97,
    published_at: pastIso(38 * 60 * 1000),
    is_pinned: true,
    is_published: true,
    created_at: pastIso(38 * 60 * 1000),
  },
  {
    id: "news-02",
    url_hash: "anthropic-mcp-remote-oauth-registry-spec-2026",
    title: "Model Context Protocol (MCP) Standardized Remote Transport & OAuth 2.1 Capability Discovery",
    source_name: "Anthropic Research",
    source_url: "https://www.anthropic.com/news",
    category: "AGENTS",
    gravity_take:
      "Standardizing stateless HTTP+SSE transport and scoped token exchange removes the local stdio bottleneck for enterprise MCP servers. Expect B2B SaaS integrations to collapse from months of custom REST glue into single-endpoint MCP manifest registrations.",
    impact_score: 94,
    published_at: pastIso(2 * HOUR),
    is_pinned: false,
    is_published: true,
    created_at: pastIso(2 * HOUR),
  },
  {
    id: "news-03",
    url_hash: "arxiv-verifiable-multi-agent-consensus-2026",
    title: "arXiv:2611.08412 — Deterministic Verification Gates Outperform Reflexion Loops in Multi-Agent Coding",
    source_name: "arXiv cs.AI",
    source_url: "https://arxiv.org/list/cs.AI/recent",
    category: "RESEARCH",
    gravity_take:
      "Empirical benchmarks across 4,200 repository tasks prove that pairing a fast generator model with strict compiler/AST verification gates beats 5x larger unverified reasoning chains by 31% while cutting token spend by 68%. Validate every agent output against a deterministic compiler or schema before advancing state.",
    impact_score: 92,
    published_at: pastIso(4 * HOUR),
    is_pinned: false,
    is_published: true,
    created_at: pastIso(4 * HOUR),
  },
  {
    id: "news-04",
    url_hash: "vercel-nextjs-standalone-edge-workloads-2026",
    title: "Zero-Cold-Start Node & Standalone Containers for Long-Running AI Agent Streams",
    source_name: "Vercel Engineering",
    source_url: "https://vercel.com/blog",
    category: "DEVTOOLS",
    gravity_take:
      "Fluid compute memory sharing eliminates the historic trade-off between serverless auto-scaling and stateful multi-step agent execution. Architecting Next.js apps with standalone output guarantees identical behavior across Vercel and self-hosted Coolify/Docker clusters.",
    impact_score: 89,
    published_at: pastIso(6 * HOUR),
    is_pinned: false,
    is_published: true,
    created_at: pastIso(6 * HOUR),
  },
  {
    id: "news-05",
    url_hash: "hn-sqlite-pgvector-hybrid-retrieval-latency-2026",
    title: "Show HN: Sub-8ms Hybrid BM25 + HNSW Vector Retrieval in Postgres Without External Sidecars",
    source_name: "Hacker News",
    source_url: "https://news.ycombinator.com",
    category: "OPEN_SOURCE",
    gravity_take:
      "Running reciprocal rank fusion directly inside PostgreSQL via GIN + pgvector indexes eliminates network serialization hops and dual-database drift. Keep your operational tables and semantic embeddings in a single transactional store until you exceed 50M rows.",
    impact_score: 88,
    published_at: pastIso(9 * HOUR),
    is_pinned: false,
    is_published: true,
    created_at: pastIso(9 * HOUR),
  },
  {
    id: "news-06",
    url_hash: "openai-realtime-webrtc-function-calling-2026",
    title: "OpenAI Realtime WebRTC Transport Adds Interruptible Background Tool Execution",
    source_name: "OpenAI News",
    source_url: "https://openai.com/news",
    category: "AGENTS",
    gravity_take:
      "Asynchronous tool completion over WebRTC data channels allows voice and operations agents to keep conversing while slow ERP or payment queries resolve in the background. Critical primitive for SME operations agents like G-02 // OpsPilot.",
    impact_score: 90,
    published_at: pastIso(13 * HOUR),
    is_pinned: false,
    is_published: true,
    created_at: pastIso(13 * HOUR),
  },
  {
    id: "news-07",
    url_hash: "github-trending-webcodecs-canvas-recorder-2026",
    title: "GitHub Trending: Hardware-Accelerated WebCodecs Frame Synthesizer for Deterministic UI Video Export",
    source_name: "GitHub Trending",
    source_url: "https://github.com/trending",
    category: "DEVTOOLS",
    gravity_take:
      "Stepping animation timelines frame-by-frame via VideoEncoder API produces bit-perfect 60fps MP4 exports directly in Chromium without server render farms. Directly validates the zero-marginal-cost rendering thesis behind G-03 // Kinetic Studio.",
    impact_score: 85,
    published_at: pastIso(18 * HOUR),
    is_pinned: false,
    is_published: true,
    created_at: pastIso(18 * HOUR),
  },
  {
    id: "news-08",
    url_hash: "techcrunch-vertical-ai-foundries-outperform-wrappers-2026",
    title: "Enterprise Buyers Shift Budgets From Generic SaaS Seats to Outcome-Priced AI Systems Foundries",
    source_name: "TechCrunch AI",
    source_url: "https://techcrunch.com/category/artificial-intelligence/",
    category: "BUSINESS",
    gravity_take:
      "Mid-market and enterprise technical leads are bypassing seat-licensed AI wrappers in favor of bespoke, IP-transferred workflow systems that deploy in under 30 days. Productized 5-day audits paired with 4-week Velocity MVPs capture the highest conversion velocity.",
    impact_score: 87,
    published_at: pastIso(22 * HOUR),
    is_pinned: false,
    is_published: true,
    created_at: pastIso(22 * HOUR),
  },
];

export const SEED_DISPATCHES: Dispatch[] = [
  {
    id: "disp-004",
    issue_number: "004",
    slug: "multi-provider-signal-extraction-x-hackathon-radar",
    title: "Multi-Provider Signal Extraction: Engineering a Deterministic + Gemini Flash Radar for X and Global Hackathons",
    subtitle:
      "Why the highest-leverage AI hackathons break on X (Twitter) 72 hours before hitting aggregators—and how we built a fault-tolerant, cross-source deduplication pipeline to capture them.",
    category: "AI SYSTEMS",
    author_name: "Enwedo Akaolisa Gift",
    author_role: "Principal Architect // G-Gravitator & OXAKALABS",
    reading_time_mins: 8,
    tags: ["GEMINI FLASH", "INGESTION", "DEDUPLICATION", "X PIPELINE", "SYSTEM DESIGN"],
    is_featured: true,
    published_at: pastIso(1 * DAY),
    created_at: pastIso(1 * DAY),
    updated_at: pastIso(1 * DAY),
    mdx_content: `## The Discovery Asymmetry in Global Hackathons

Most builders discover hackathons only after they appear on legacy directory front pages. By then, half the registration window has evaporated. Inside **OXAKALABS // Skunkworks**, four years of 48-hour builds taught us a basic structural rule: **frontier AI sprints—from Cerebral Valley and Google DeepMind to Anthropic, Vercel, and protocol syndicates—are announced first as raw posts on X (Twitter) or Luma calendar links.**

When we architected the **G-Gravitator Live Hackathon Tracker (\`/hackathons\`)**, we refused to build another static link directory. We needed an aerospace-grade radar that unifies 10 distinct providers while staying resilient against API rate limits, noisy social chatter, and cross-posted duplicates.

## 1. The Multi-Tier X (Twitter) Adapter Pattern

Relying on a single social scraping endpoint is a guaranteed single point of failure. We structured \`lib/ingestion/hackathons/twitter-adapter.ts\` around a three-stage fallback cascade:

\`\`\`typescript
// Canonical X Query Operator used by G-Gravitator
const X_HACKATHON_QUERY =
  '("hackathon" OR "buildathon") ("AI" OR "agents" OR "LLM" OR "prize" OR "$") ' +
  '(apply OR register OR lu.ma OR devpost OR dorahacks) -is:retweet lang:en';
\`\`\`

1. **Primary Mode (\`x_api\`):** Queries X API v2 Recent Search every 6 hours across our operator grammar and high-signal monitored accounts (\`@devpost\`, \`@DoraHacks\`, \`@lablabai\`, \`@cerebral_valley\`, \`@GoogleAI\`, \`@AnthropicAI\`, \`@OpenAIDevs\`, \`@vercel\`, \`@supabase\`).
2. **Search Bridge Mode (\`search_api\` / \`apify\`):** Falls back to indexed \`site:x.com\` discovery when direct bearer quotas are constrained.
3. **Zero-Key Public Syndication & oEmbed Resolver:** Whenever an OXAKALABS scout or community builder pastes an \`x.com\` status URL into \`POST /api/hackathons/submit\`, our resolver extracts the tweet payload directly via X's public Syndication and oEmbed endpoints—expanding shortened \`t.co\` links before passing the text to normalization.

## 2. Two-Stage Noise Gate: Heuristics First, Gemini Flash Second

To prevent runaway LLM bills, raw feeds never touch the model unfiltered. Every candidate first passes a deterministic pre-filter:

- **Batch Ceiling:** Hard cap of 30 raw tweets and 40 news items per cron execution.
- **Temporal & Lexical Guard:** Rejects posts containing retrospective markers (*"congrats to the winners"*, *"recap of last weekend"*, *"demo day highlights"*) unless paired with an explicit upcoming registration deadline.

Survivors enter our structured normalization gate powered by **Gemini 2.5 Flash** (\`@google/genai\`) with a strict JSON Schema contract—backed by a deterministic heuristic parser when running offline:

\`\`\`typescript
export interface NormalizedHackathonCandidate {
  is_valid_upcoming_hackathon: boolean;
  title: string;
  organizer: string;
  summary: string; // Strictly 2 crisp sentences
  prize_pool_usd: number | null;
  prize_display: string;
  start_at: string | null;
  deadline_at: string;
  format: "ONLINE" | "IN_PERSON" | "HYBRID";
  location: string;
  themes: string[];
  registration_url: string;
  confidence_score: number; // 0.00 - 1.00
}
\`\`\`

Candidates scoring \`>= 0.80\` auto-publish to the live radar. Candidates between \`0.50\` and \`0.79\` route directly into the **Curator Admin Console (\`/admin\`)** moderation queue. Anything below \`0.50\` is dropped at the perimeter.

## 3. Cross-Source Fingerprint Deduplication

A major hackathon announced on X by \`@GoogleAI\` on Tuesday will appear on Devpost by Thursday. Naive aggregators render two separate cards.

Our deduplicator computes a dual key:
- **Lexical Fingerprint:** \`normalize(titleTokens) + "::" + normalize(organizer) + "::" + YYYY_MM\`
- **Canonical URL Fingerprint:** Stripping protocol, \`www.\`, query parameters, and trailing slashes from the resolved registration URL.

When an incoming X signal matches an existing Devpost record, we merge their \`sources\` JSONB arrays into a single database row—preserving the highest-confidence deadline and prize pool while rendering **both \`DEVPOST\` and \`X\` badges** on a single card.`,
  },
  {
    id: "disp-003",
    issue_number: "003",
    slug: "inside-the-48-hour-strike-loop-oxakalabs-graduation-filter",
    title: "Inside the 48-Hour Strike Loop: How OXAKALABS Hunts, Builds, and Graduates Hackathon Prototypes Into Commercial Drops",
    subtitle:
      "Most hackathon teams ship slideware that rots on GitHub by Monday morning. Here is the 25-point mathematical filter we use to promote weekend experiments like DEMOPILOT into G-Gravitator Labs.",
    category: "HACKATHON LOG",
    author_name: "Enwedo Akaolisa Gift",
    author_role: "Founder // OXAKALABS & G-Gravitator",
    reading_time_mins: 7,
    tags: ["OXAKALABS", "SKUNKWORKS", "GRADUATION SCORECARD", "DEMOPILOT", "PRODUCT STRATEGY"],
    is_featured: false,
    published_at: pastIso(5 * DAY),
    created_at: pastIso(5 * DAY),
    updated_at: pastIso(5 * DAY),
    mdx_content: `## Why We Elevated OXAKALABS Into G-Gravitator's Skunkworks

Founded in 2022, **OXAKALABS** was built as a high-velocity R&D sandbox and hackathon strike team. Over dozens of sprints—ranging from **DEMOPILOT** and the **All-Things-Agentic Harness** to **Aify Cycle** and the **Nexus Retail Operations Suite**—we noticed a recurring failure mode across the builder ecosystem: teams treat hackathons either as disposable theatrical demos or try to turn every weekend toy into a venture startup.

Both extremes waste engineering mass. Within **G-Gravitator**, OXAKALABS operates as our official **Skunkworks Foundry (\`OXAKALABS // by G-Gravitator\`)**— governed by a strict, unsentimental promotion protocol.

## The 25-Point Graduation Scorecard

Every Monday after a 48-hour sprint, the prototype is evaluated across five orthogonal axes scored from \`1\` to \`5\`:

1. **Pain Intensity (1–5):** Is this solving an acute, recurring operational bleed, or a novelty demo prompt?
2. **Willingness to Pay (1–5):** Can an enterprise buyer or prosumer immediately anchor this to saved engineering hours or revenue lift?
3. **Technical Moat & Craft (1–5):** Does the execution contain non-trivial state management, schema verification, or kinetic polish that generic wrappers cannot replicate in an afternoon?
4. **Distribution Hook (1–5):** Does the artifact market itself when shared (e.g., an interactive deck link, a benchmark badge, or an autonomous WhatsApp loop)?
5. **Solo / Lean Maintainability (1–5):** Can a 1-to-3 engineer cell operate and scale the unit without drowning in support debt?

\`\`\`text
TOTAL SCORE 20–25 / 25  ==>  PROMOTE TO G-GRAVITATOR LABS (Numbered Drop G-XX)
TOTAL SCORE 14–19 / 25  ==>  PUBLISH AS B2B CASE STUDY & OPEN-SOURCE REPOSITORY
TOTAL SCORE < 14  / 25  ==>  WRITE POST-MORTEM DISPATCH & ARCHIVE CLEANLY
\`\`\`

## Case Study: From OXA-01 (DEMOPILOT) to G-01 (GRAVITY DECK)

When we built **DEMOPILOT** (\`github.com/Aka4real/DEMOPILOT\`), the immediate goal was eliminating fragile video demos during technical judging. After testing it with founders who wanted the exact same kinetic, telemetry-backed micro-site engine for their seed pitches and enterprise architecture reviews, it scored **23/25** on the Graduation Filter—earning promotion into **G-01 // GRAVITY DECK**.`,
  },
  {
    id: "disp-002",
    issue_number: "002",
    slug: "85-15-kinetic-luxury-specification-engineering-interfaces-with-mass",
    title: "The 85/15 Kinetic Luxury Specification: Engineering Interfaces With Physical Mass",
    subtitle:
      "Rejecting purple-gradient AI slop in favor of Porsche Design structural silence, Teenage Engineering telemetry, and damped spring physics.",
    category: "DESIGN ENGINEERING",
    author_name: "Enwedo Akaolisa Gift",
    author_role: "Design Engineering Lead // G-Gravitator",
    reading_time_mins: 6,
    tags: ["KINETIC LUXURY", "DESIGN SYSTEM", "FRAMER MOTION", "TYPOGRAPHY", "UI ARCHITECTURE"],
    is_featured: false,
    published_at: pastIso(9 * DAY),
    created_at: pastIso(9 * DAY),
    updated_at: pastIso(9 * DAY),
    mdx_content: `## The Visual Crisis of Modern AI Software

Walk through fifty AI startup landing pages today and you will see the exact same template: purple-to-indigo radial blobs, floating glassmorphic cards with blurred borders, and centered three-column marketing clichés. It signals zero engineering weight.

When defining G-Gravitator's visual language—**Kinetic Luxury**—we looked outside software to industrial instruments that hold physical load: **Porsche Design chronographs, Teenage Engineering synthesizers, and Swiss aerospace schematics.**

## The 85 / 15 Allocation Rule

Every viewport across G-Gravitator obeys a strict compositional ratio:

- **85% Minimalist Luxury:** Architectural silence. An **Event Horizon (\`#09090B\`)** canvas divided by exposed \`1px solid #27272A\` Brushed Tungsten structural gridlines, pinned at key intersections by \`9px × 9px\` hairline \`+\` registration crosshairs. Zero muddy drop shadows; depth is communicated strictly through surface luminance step-ups (\`#09090B\` → \`#111114\` → \`#18181B\`).
- **15% Bold Kinetic:** Surgical bursts of **Ion Signal (\`#FF3B1F\`)** reserved exclusively for primary conversion vectors, urgent \`< 48h\` hackathon countdowns, and active telemetry nodes—paired with physically weighted motion.

\`\`\`typescript
// G-Gravitator Canonical Motion Physics
export const HEAVY_PRECISION_SPRING = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
  mass: 1.2,
};

export const KINETIC_SNAP_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};
\`\`\`

Notice the \`mass: 1.2\` parameter on our primary spring preset. Cheap animations feel weightless because they use low mass and under-damped bounce. By increasing virtual mass and critical damping, elements—from the stretched **\`G—GRAVITATOR\`** spacetime vector wordmark to our magnetic CTAs—accelerate with deliberate inertia and lock into place with mechanical certainty.`,
  },
  {
    id: "disp-001",
    issue_number: "001",
    slug: "center-of-mass-why-we-built-g-gravitator",
    title: "Center of Mass: Why We Built G-Gravitator & The Four-Unit Operating Flywheel",
    subtitle:
      "Most labs either chase aesthetics with no engine underneath, or ship raw engineering nobody wants to touch. G-Gravitator exists where software craftsmanship, applied AI, and radical creativity collide.",
    category: "ARCHITECTURE",
    author_name: "Enwedo Akaolisa Gift",
    author_role: "Founder // G-Gravitator Labs Ltd",
    reading_time_mins: 5,
    tags: ["MANIFESTO", "FLYWHEEL", "SYSTEMS", "LABS", "ORBIT"],
    is_featured: false,
    published_at: pastIso(14 * DAY),
    created_at: pastIso(14 * DAY),
    updated_at: pastIso(14 * DAY),
    mdx_content: `## Build With Weight

Great ideas, elite talent, and capital naturally bend toward high-mass builders. Just as Y Combinator turned a mathematical fixed-point combinator into an unmistakable badge of builder credibility, **G-Gravitator** uses orbital physics as its cultural and engineering shorthand: a laboratory where raw ideas gain enough engineering mass to pull markets toward them.

## One Masterbrand, Four Interlocking Units

Consultancies stall because client work starves internal products. Product studios stall because they run out of capital waiting for a hit. Hackathon teams stall because their best prototypes die on Sunday night.

We architected G-Gravitator as a closed-loop four-unit flywheel:

1. **G-Gravitator Systems (\`/systems\`):** High-ticket B2B foundry delivering 5-day Gravity Audits, 4-week Velocity MVPs, and fractional R&D retainers. Generates non-dilutive cashflow and exposes us directly to enterprise operational bottlenecks.
2. **OXAKALABS // Skunkworks (\`/skunkworks\` & \`/hackathons\`):** Our 48-hour experimental R&D foundry and global hackathon strike arm. Stress-tests frontier models and agent protocols under extreme time compression.
3. **G-Gravitator Labs (\`/labs\`):** Ships proprietary software and AI tools as numbered industrial drops (\`G-01\` through \`G-04\`), seeded by the highest-scoring prototypes graduating from OXAKALABS and battle-tested patterns from Systems.
4. **G-Gravitator Orbit (\`/orbit\`):** Selective 6-week technical training cohorts (*Gravity Cycles*) that pull the sharpest emerging engineers and design technologists directly into our ecosystem.`,
  },
];

export const SEED_CLIENT_INQUIRIES: ClientInquiry[] = [
  {
    id: "inq-01",
    name: "Marcus Vance",
    email: "mvance@meridianlogistics.io",
    company: "Meridian Freight & Customs",
    tier: "VELOCITY_MVP",
    budget_range: "$4,500 – $6,000",
    timeline: "4 Weeks (Immediate Start)",
    project_brief:
      "Need an autonomous WhatsApp + email customs manifest extraction and quoting pipeline integrated with our Postgres ERP.",
    status: "DISCOVERY_CALL",
    created_at: pastIso(2 * DAY),
  },
  {
    id: "inq-02",
    name: "Tunde Bakare",
    email: "tunde@paycrest-ops.ng",
    company: "PayCrest Treasury Systems",
    tier: "GRAVITY_AUDIT",
    budget_range: "₦1.2M – ₦1.6M",
    timeline: "5-Day Sprint Next Week",
    project_brief:
      "5-day Gravity Audit of our settlement reconciliation queue to identify deterministic AI agent automation targets.",
    status: "NEW",
    created_at: pastIso(8 * HOUR),
  },
];

export const SEED_ORBIT_WAITLIST: OrbitApplication[] = [
  {
    id: "orb-01",
    full_name: "Chidera Okafor",
    email: "chidera.dev@gmail.com",
    track: "AI_ENGINEERING",
    portfolio_url: "https://github.com/Aka4real",
    proof_of_work:
      "Built a multi-agent TypeScript schema verifier and local MCP server handling 12k daily tool invocations.",
    created_at: pastIso(3 * DAY),
  },
];

export const SEED_NEWSLETTER_SUBSCRIBERS: NewsletterSubscriber[] = [
  {
    id: "sub-01",
    email: "founder@ggravitator.com",
    source: "journal",
    created_at: pastIso(10 * DAY),
  },
];
