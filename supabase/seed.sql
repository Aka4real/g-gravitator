-- =============================================================================
-- G-GRAVITATOR — FULL IDEMPOTENT SEED DATA (supabase/seed.sql)
-- Matches lib/seed-fallback.ts across lab_projects, hackathons, news_items,
-- and dispatches. Safe to re-run (ON CONFLICT ... DO NOTHING).
-- Run after 001_init.sql and 002_ops_platform.sql.
-- =============================================================================

-- 1. LABS & OXAKALABS SKUNKWORKS PROJECTS (G-01..G-04, OXA-01..OXA-06)
INSERT INTO lab_projects (
  code, division, name, slug, tagline, description, thesis,
  architecture_notes, changelog, status, tech_stack, live_url, repo_url,
  hackathon_origin, scorecard, sort_order
)
VALUES
  (
    'G-01', 'LABS', 'GRAVITY DECK', 'gravity-deck',
    'AI interactive pitch & launch studio converting founder notes and architecture docs into kinetic web micro-sites.',
    'Static PDF decks die in partner inboxes. Gravity Deck ingests raw technical specs, repository READMEs, and financial models to compile live, password-gated kinetic micro-sites with interactive system diagrams, live telemetry blocks, and per-investor engagement heatmaps.',
    'Technical founders lose narrative momentum translating architectural depth into flat slides. Graduated from OXAKALABS''s OXA-01 (DEMOPILOT) hackathon prototype after scoring 23/25 on the Graduation Filter, Gravity Deck treats a fundraising or enterprise sales narrative as an executable software artifact.',
    ARRAY[
      'AST & Markdown Ingestion Engine: Parses repository trees, OpenAPI specs, and founder briefs into structured narrative blocks.',
      'Kinetic Layout Compiler: Maps narrative blocks onto a deterministic 12-column Swiss editorial grid with Framer Motion spring physics.',
      'Telemetry Gate & Investor Beacon: Edge-middleware token authentication tracking section dwell time and interactive sandbox triggers.'
    ],
    '[{"version":"v0.4.2-proto","date":"2026-11-14","summary":"Added live GitHub repository tree ingestion and interactive Mermaid/SVG architecture block compiler."},{"version":"v0.3.0-proto","date":"2026-10-28","summary":"Implemented Kinetic Luxury 1px grid renderer and per-link investor telemetry beacon."},{"version":"v0.1.0-oxa","date":"2026-10-10","summary":"Graduated from OXAKALABS // Skunkworks (DEMOPILOT build, 23/25 Graduation Score)."}]'::jsonb,
    'PROTOTYPING',
    ARRAY['Next.js 15', 'TypeScript', 'Gemini 2.5 Flash', 'Framer Motion', 'Supabase Edge'],
    'https://github.com/Aka4real/DEMOPILOT',
    'https://github.com/Aka4real/DEMOPILOT',
    'Graduated from OXA-01 // DEMOPILOT (23/25 Score)',
    '{"pain_intensity": 5, "willingness_to_pay": 5, "technical_moat": 4, "distribution_hook": 5, "lean_maintainability": 4}'::jsonb,
    1
  ),
  (
    'G-02', 'LABS', 'OPSPILOT', 'opspilot',
    'Autonomous WhatsApp, email, and dashboard operations agent for high-volume SMEs (intake, quoting, invoicing, daily briefs).',
    'High-volume regional and global SMEs run their entire revenue loop over fragmented WhatsApp threads, email attachments, and spreadsheets. OpsPilot deploys a deterministic multi-agent operations kernel that triages client messages, drafts structured quotes, reconciles ledger entries, and delivers a 07:00 UTC executive telemetry brief.',
    'Enterprise ERPs are too heavy for 10-to-100 person operators, while generic chatbots hallucinate pricing. OpsPilot pairs strict schema-validated tool calling with human-in-the-loop approval gates over WhatsApp Business API and web command rails.',
    ARRAY[
      'Omnichannel Ingress Router: Normalizes WhatsApp Cloud API webhooks, IMAP/Gmail threads, and web intake forms into a unified state machine.',
      'Deterministic Quoting Engine: Enforces strict inventory and margin rules via Zod-validated tool schemas before generating PDF/Paystack/Stripe payment links.',
      'Executive Morning Wire: Automated cron synthesizer delivering daily cashflow, SLA bottleneck, and pending-approval summaries.'
    ],
    '[{"version":"v0.2.1-rnd","date":"2026-11-11","summary":"Added multi-currency USD/NGN ledger reconciliation and WhatsApp interactive approval buttons."},{"version":"v0.1.0-rnd","date":"2026-10-19","summary":"Core multi-agent state machine extracted from Nexus Retail Operations Suite R&D."}]'::jsonb,
    'R&D',
    ARRAY['TypeScript', 'Node.js', 'WhatsApp Cloud API', 'Gemini Flash', 'PostgreSQL', 'Redis'],
    NULL,
    'https://github.com/Aka4real/stitch-retail-operations-management-suite',
    'Informed by OXA-02 // Nexus Retail Operations Suite',
    '{"pain_intensity": 5, "willingness_to_pay": 5, "technical_moat": 4, "distribution_hook": 4, "lean_maintainability": 4}'::jsonb,
    2
  ),
  (
    'G-03', 'LABS', 'KINETIC STUDIO', 'kinetic-studio',
    'Browser-based AI brand & motion asset lab turning product URLs and screenshots into minimalist-luxury launch teasers.',
    'Engineers ship flagship features with zero visual gravity because motion design agencies charge $15,000 and take six weeks. Kinetic Studio scrapes a live product URL or DOM tree, extracts typography and component geometry, and renders 60fps spring-physics launch videos and interactive social cards in the browser.',
    'Distribution rewards high-mass visual craft. By codifying Porsche Design / Teenage Engineering motion curves into parameterized WebGL and Canvas scenes, Kinetic Studio gives solo builders industrial-grade launch telemetry in 90 seconds.',
    ARRAY[
      'DOM & Token Extractor: Headless browser pipeline capturing computed CSS variables, SVG marks, and layout bounding boxes.',
      'Parameterized Spring Sequencer: Deterministic timeline engine driven by physical mass, stiffness, and damping curves.',
      'WebCodecs 60fps Exporter: Client-side MP4/WebM frame encoder with zero server GPU rendering cost.'
    ],
    '[{"version":"v0.1.0-concept","date":"2026-11-05","summary":"Completed spring-physics timeline schema and WebCodecs deterministic frame capture prototype."}]'::jsonb,
    'CONCEPT',
    ARRAY['WebCodecs API', 'HTML5 Canvas', 'Framer Motion', 'Next.js', 'Tailwind CSS v4'],
    NULL,
    NULL,
    'Internal G-Gravitator Design Engineering Spec',
    '{"pain_intensity": 4, "willingness_to_pay": 4, "technical_moat": 5, "distribution_hook": 5, "lean_maintainability": 4}'::jsonb,
    3
  ),
  (
    'G-04', 'LABS', 'ORBITBENCH', 'orbitbench',
    'Multi-agent prompt & workflow evaluation workbench for side-by-side LLM latency, schema adherence, and cost benchmarking.',
    'Production AI systems fail silently when prompt edits break downstream JSON schemas or triple token latency. OrbitBench runs parallel regression suites across Gemini, Claude, OpenAI, and open-weight models, scoring strict JSON Schema compliance, tool-call determinism, time-to-first-token, and cost-per-1k runs.',
    'Born directly inside OXAKALABS while debugging multi-agent hackathon harnesses under 48-hour pressure, OrbitBench replaces vibes-based prompt tweaking with repeatable engineering telemetry.',
    ARRAY[
      'Parallel Model Harness: Concurrent execution runner with unified token, latency, and cost accounting across 6 model providers.',
      'Strict Zod/JSON-Schema Diffing: Highlights exact field-level structural drift and hallucinated keys across 100+ test fixtures.',
      'CI/CD GitHub Action Gate: Blocks pull requests when schema compliance drops below 99.5% or p95 latency spikes.'
    ],
    '[{"version":"v0.2.0-skunkworks","date":"2026-11-16","summary":"Benchmarked Gemini 2.5 Flash structured outputs against multi-provider hackathon extraction fixtures."}]'::jsonb,
    'SKUNKWORKS CANDIDATE',
    ARRAY['TypeScript', '@google/genai', 'Zod', 'Next.js', 'Vitest'],
    'https://github.com/Aka4real/All-Things-Agentic-Hackathon',
    'https://github.com/Aka4real/All-Things-Agentic-Hackathon',
    'Born in OXA-03 // All-Things-Agentic Hackathon',
    '{"pain_intensity": 5, "willingness_to_pay": 4, "technical_moat": 4, "distribution_hook": 4, "lean_maintainability": 5}'::jsonb,
    4
  ),
  (
    'OXA-01', 'SKUNKWORKS', 'DEMOPILOT', 'demopilot',
    'Autonomous demo engineering & interactive product walkthrough synthesis engine built for high-stakes technical launches.',
    'Built in a 48-hour OXAKALABS sprint to eliminate dead demo videos during hackathon judging and founder pitches. DEMOPILOT synthesizes live product states, voiceover telemetry, and guided interactive DOM walkthroughs, graduating directly into G-01 // GRAVITY DECK.',
    NULL, '{}', '[]'::jsonb,
    'LIVE',
    ARRAY['TypeScript', 'Next.js', 'AI Agents', 'DOM Telemetry', 'Framer Motion'],
    'https://github.com/Aka4real/DEMOPILOT',
    'https://github.com/Aka4real/DEMOPILOT',
    'OXAKALABS 48-Hour Flagship Build → Promoted to Labs G-01',
    '{"pain_intensity": 5, "willingness_to_pay": 5, "technical_moat": 4, "distribution_hook": 5, "lean_maintainability": 4}'::jsonb,
    10
  ),
  (
    'OXA-02', 'SKUNKWORKS', 'NEXUS RETAIL OPERATIONS SUITE', 'nexus-retail-operations-suite',
    'Multi-tier RBAC retail operations management suite engineered with Google Stitch design tokens and Emil Kowalski motion craft.',
    'Full-spectrum enterprise retail command center uniting inventory velocity tracking, role-based access clearance (RBAC), audit logs, and micro-interaction precision. Serves as the foundational B2B reference architecture for G-Gravitator Systems and G-02 // OPSPILOT.',
    NULL, '{}', '[]'::jsonb,
    'LIVE',
    ARRAY['TypeScript', 'React', 'Google Stitch Tokens', 'RBAC Architecture', 'Kinetic UI'],
    'https://github.com/Aka4real/stitch-retail-operations-management-suite',
    'https://github.com/Aka4real/stitch-retail-operations-management-suite',
    'OXAKALABS Enterprise Design Engineering Sprint',
    '{"pain_intensity": 5, "willingness_to_pay": 5, "technical_moat": 4, "distribution_hook": 3, "lean_maintainability": 4}'::jsonb,
    11
  ),
  (
    'OXA-03', 'SKUNKWORKS', 'ALL-THINGS-AGENTIC HARNESS', 'all-things-agentic-harness',
    'Multi-agent autonomous orchestration, tool-verification, and execution telemetry harness built for the All-Things-Agentic Hackathon.',
    'Coordinates specialized planner, researcher, and verifier agents over deterministic JSON contracts with automatic rollback when tool outputs violate safety or schema thresholds. Direct precursor to G-04 // ORBITBENCH.',
    NULL, '{}', '[]'::jsonb,
    'LIVE',
    ARRAY['Multi-Agent Systems', 'TypeScript', 'Tool Calling', 'JSON Schema', 'LLM Eval'],
    'https://github.com/Aka4real/All-Things-Agentic-Hackathon',
    'https://github.com/Aka4real/All-Things-Agentic-Hackathon',
    'All-Things-Agentic Global AI Hackathon',
    '{"pain_intensity": 5, "willingness_to_pay": 4, "technical_moat": 5, "distribution_hook": 4, "lean_maintainability": 4}'::jsonb,
    12
  ),
  (
    'OXA-04', 'SKUNKWORKS', 'AIFY CYCLE', 'aify-cycle',
    'Cyclic AI workflow automation engine converting recurring operational bottlenecks into self-verifying background loops.',
    'Designed for lean engineering teams to wire trigger-evaluate-act loops across webhooks, repositories, and operational databases without brittle DAG boilerplate.',
    NULL, '{}', '[]'::jsonb,
    'BETA',
    ARRAY['TypeScript', 'Next.js', 'Workflow Engine', 'Webhooks', 'Autonomous Loops'],
    'https://github.com/Aka4real/aify-cycle',
    'https://github.com/Aka4real/aify-cycle',
    'OXAKALABS Automation Sprint',
    '{"pain_intensity": 4, "willingness_to_pay": 4, "technical_moat": 4, "distribution_hook": 3, "lean_maintainability": 4}'::jsonb,
    13
  ),
  (
    'OXA-05', 'SKUNKWORKS', 'AI-API-ATP // AUTONOMOUS API AGENT', 'ai-api-atp',
    'Autonomous API discovery, endpoint probing, and typed tool-wrapper synthesis agent.',
    'Point AI-API-ATP at raw documentation or an unfamiliar REST endpoint and it maps authentication headers, infers payload schemas, and emits verified TypeScript/MCP tool definitions ready for agent consumption.',
    NULL, '{}', '[]'::jsonb,
    'PROTOTYPING',
    ARRAY['AI Agents', 'OpenAPI Synthesis', 'TypeScript', 'MCP Tooling'],
    'https://github.com/Aka4real/ai-api-atp',
    'https://github.com/Aka4real/ai-api-atp',
    'OXAKALABS Tooling Experiment',
    '{"pain_intensity": 4, "willingness_to_pay": 4, "technical_moat": 4, "distribution_hook": 4, "lean_maintainability": 4}'::jsonb,
    14
  ),
  (
    'OXA-06', 'SKUNKWORKS', 'SOLANA TOKEN LAUNCH FORGE', 'solana-token-launcher',
    'Zero-friction SPL token deployment, metadata pinning, and on-chain liquidity telemetry console.',
    'Rapid Web3 protocol experiment automating SPL mint authority configuration, IPFS metadata registration, and real-time transaction verification on Solana devnet/mainnet.',
    NULL, '{}', '[]'::jsonb,
    'ARCHIVED',
    ARRAY['Solana Web3.js', 'SPL Token', 'TypeScript', 'React', 'Wallet Adapter'],
    'https://github.com/Aka4real/solana-token-launcher',
    'https://github.com/Aka4real/solana-token-launcher',
    'Web3 Rapid Protocol Sprint (B2B Case Study & Open Source)',
    '{"pain_intensity": 3, "willingness_to_pay": 4, "technical_moat": 3, "distribution_hook": 3, "lean_maintainability": 3}'::jsonb,
    15
  )
ON CONFLICT (code) DO NOTHING;

-- 2. HACKATHONS (10 Published + 1 Pending Review)
INSERT INTO hackathons (
  fingerprint, title, slug, organizer, summary, prize_pool_usd, prize_display,
  start_at, deadline_at, format, location, themes, sources, primary_url,
  source_tweet_url, oxakalabs_status, confidence_score, is_published,
  is_featured, approval_status, created_by
)
VALUES
  (
    'google-gemini-agentic-buildathon-2026-11',
    'Gemini Multi-Agent & MCP Frontier Buildathon',
    'gemini-multi-agent-mcp-frontier-buildathon',
    'Google DeepMind & Devpost',
    'Engineer production multi-agent systems, structured tool-calling pipelines, and real-time multimodal applications powered by Gemini 2.5 Flash and Pro.',
    100000, '$100,000 + $50k Cloud Credits',
    NOW() - INTERVAL '5 days', NOW() + INTERVAL '34 hours',
    'ONLINE', 'Global / Remote',
    ARRAY['AI', 'Agents', 'Open Source', 'SaaS / Web'],
    '[{"provider": "devpost", "url": "https://devpost.com/hackathons"}, {"provider": "twitter", "url": "https://x.com/GoogleAI/status/189001020304050607"}]'::jsonb,
    'https://devpost.com/hackathons',
    'https://x.com/GoogleAI/status/189001020304050607',
    'SQUAD_DEPLOYED', 0.99, TRUE, TRUE, 'APPROVED', 'ingestion'
  ),
  (
    'cerebral-valley-autonomous-agents-jam-2026-11',
    'Cerebral Valley × Anthropic Autonomous Systems Sprint',
    'cerebral-valley-anthropic-autonomous-systems-sprint',
    'Cerebral Valley & Anthropic',
    '48-hour high-density builder sprint focused on computer-use agents, deterministic code verification, and zero-latency developer workflows. Announced directly via X prior to public aggregator indexing.',
    65000, '$65,000 + API Compute Grants',
    NOW() - INTERVAL '1 day', NOW() + INTERVAL '44 hours',
    'HYBRID', 'San Francisco & Global Remote',
    ARRAY['AI', 'Agents', 'SaaS / Web'],
    '[{"provider": "twitter", "url": "https://x.com/cerebral_valley/status/189009887766554433"}, {"provider": "luma", "url": "https://lu.ma/cerebralvalley"}]'::jsonb,
    'https://lu.ma/cerebralvalley',
    'https://x.com/cerebral_valley/status/189009887766554433',
    'SCOUTING', 0.96, TRUE, TRUE, 'APPROVED', 'ingestion'
  ),
  (
    'dorahacks-sovereign-ai-infra-bounty-2026-11',
    'DoraHacks Global Decentralized AI & Verifiable Compute Grant',
    'dorahacks-global-decentralized-ai-verifiable-compute',
    'DoraHacks',
    'Build verifiable inference pipelines, cryptographic agent identity standards, and autonomous on-chain treasury execution engines.',
    150000, '$150,000 USDC Bounty Pool',
    NOW() - INTERVAL '10 days', NOW() + INTERVAL '4 days 11 hours',
    'ONLINE', 'Global / Remote',
    ARRAY['AI', 'Agents', 'Web3', 'Open Source'],
    '[{"provider": "dorahacks", "url": "https://dorahacks.io/bugbounty"}, {"provider": "twitter", "url": "https://x.com/DoraHacks/status/189002334455667788"}]'::jsonb,
    'https://dorahacks.io/hackathons',
    'https://x.com/DoraHacks/status/189002334455667788',
    'SCOUTING', 0.95, TRUE, TRUE, 'APPROVED', 'ingestion'
  ),
  (
    'vercel-supabase-ai-ship-week-hackathon-2026-11',
    'Vercel × Supabase Edge AI & Realtime Agents Challenge',
    'vercel-supabase-edge-ai-realtime-agents-challenge',
    'Vercel & Supabase',
    'Ship full-stack Next.js App Router applications pairing pgvector hybrid semantic search, background queues, and sub-50ms streaming agent interfaces.',
    45000, '$45,000 + Pro Team Credits',
    NOW() - INTERVAL '3 days', NOW() + INTERVAL '6 days 8 hours',
    'ONLINE', 'Global / Remote',
    ARRAY['AI', 'Agents', 'SaaS / Web', 'Open Source'],
    '[{"provider": "twitter", "url": "https://x.com/supabase/status/189003445566778899"}]'::jsonb,
    'https://supabase.com/blog',
    'https://x.com/supabase/status/189003445566778899',
    'SQUAD_DEPLOYED', 0.94, TRUE, TRUE, 'APPROVED', 'ingestion'
  ),
  (
    'lablab-nextgen-voice-multimodal-agents-2026-11',
    'Lablab.ai Realtime Multimodal & Voice Operations Sprint',
    'lablab-realtime-multimodal-voice-operations-sprint',
    'Lablab.ai',
    '7-day global AI sprint focused on low-latency WebRTC voice agents, automated customer operations, and real-time visual telemetry.',
    30000, '$30,000 + Compute Credits',
    NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days 16 hours',
    'ONLINE', 'Global / Remote',
    ARRAY['AI', 'Agents', 'SaaS / Web', 'Fintech'],
    '[{"provider": "lablab", "url": "https://lablab.ai/event"}]'::jsonb,
    'https://lablab.ai/event',
    NULL,
    'SUBMITTED', 0.92, TRUE, FALSE, 'APPROVED', 'ingestion'
  ),
  (
    'ethglobal-agentic-commerce-hack-2026-12',
    'ETHGlobal Autonomous Commerce & Programmable Payments',
    'ethglobal-autonomous-commerce-programmable-payments',
    'ETHGlobal',
    'Architect machine-to-machine stablecoin settlement protocols, autonomous procurement agents, and verifiable escrow rails.',
    250000, '$250,000 Partner Protocol Pool',
    NOW() + INTERVAL '2 days', NOW() + INTERVAL '9 days 4 hours',
    'HYBRID', 'London & Global Online',
    ARRAY['Agents', 'Web3', 'Fintech'],
    '[{"provider": "ethglobal", "url": "https://ethglobal.com/events"}, {"provider": "twitter", "url": "https://x.com/ETHGlobal/status/189004556677889900"}]'::jsonb,
    'https://ethglobal.com/events',
    'https://x.com/ETHGlobal/status/189004556677889900',
    'SCOUTING', 0.97, TRUE, FALSE, 'APPROVED', 'ingestion'
  ),
  (
    'kaggle-arc-agi-reasoning-frontier-prize-2026-12',
    'Kaggle Program Synthesis & Neuro-Symbolic Reasoning Prize',
    'kaggle-program-synthesis-neuro-symbolic-reasoning-prize',
    'Kaggle & Frontier Research Labs',
    'Advance sample-efficient program synthesis and zero-shot abstract reasoning under strict compute and latency budgets.',
    125000, '$125,000 Cash Prize',
    NOW() - INTERVAL '14 days', NOW() + INTERVAL '18 days 6 hours',
    'ONLINE', 'Global / Remote',
    ARRAY['AI', 'Open Source'],
    '[{"provider": "kaggle", "url": "https://www.kaggle.com/competitions"}]'::jsonb,
    'https://www.kaggle.com/competitions',
    NULL,
    'NONE', 0.98, TRUE, FALSE, 'APPROVED', 'ingestion'
  ),
  (
    'devfolio-emerging-markets-fintech-ai-build-2026-12',
    'Devfolio Pan-African & Global South Fintech + AI Operating Rails',
    'devfolio-pan-african-global-south-fintech-ai-rails',
    'Devfolio & Regional Ecosystem Partners',
    'Engineer cross-border SME settlement tools, WhatsApp-native commerce intelligence, and low-bandwidth clinical triage systems.',
    40000, '$40,000 + Accelerator Fast-Track',
    NOW() - INTERVAL '1 day', NOW() + INTERVAL '11 days 14 hours',
    'HYBRID', 'Lagos / Nairobi / Global Online',
    ARRAY['AI', 'Fintech', 'HealthTech', 'SaaS / Web'],
    '[{"provider": "devfolio", "url": "https://devfolio.co/hackathons"}, {"provider": "twitter", "url": "https://x.com/devfolio/status/189005667788990011"}]'::jsonb,
    'https://devfolio.co/hackathons',
    'https://x.com/devfolio/status/189005667788990011',
    'SQUAD_DEPLOYED', 0.95, TRUE, FALSE, 'APPROVED', 'ingestion'
  ),
  (
    'mlh-global-hack-week-ai-systems-2026-12',
    'MLH Global Hack Week: Applied AI & Developer Tooling Season',
    'mlh-global-hack-week-applied-ai-developer-tooling',
    'Major League Hacking (MLH)',
    'Week-long high-velocity engineering marathon shipping open-source CLI harnesses, compiler plugins, and multi-model developer sandboxes.',
    20000, '$20,000 + Hardware & Fellowship Grants',
    NOW() + INTERVAL '1 day', NOW() + INTERVAL '8 days 2 hours',
    'ONLINE', 'Global / Remote',
    ARRAY['AI', 'Open Source', 'SaaS / Web'],
    '[{"provider": "mlh", "url": "https://mlh.io/seasons/2026/events"}]'::jsonb,
    'https://mlh.io/seasons/2026/events',
    NULL,
    'NONE', 0.93, TRUE, FALSE, 'APPROVED', 'ingestion'
  ),
  (
    'unstop-industrial-robotics-edge-ai-challenge-2026-12',
    'Unstop Edge Silicon, Robotics & Embodied AI Grand Challenge',
    'unstop-edge-silicon-robotics-embodied-ai-challenge',
    'Unstop & Industrial Foundry Consortium',
    'Deploy quantized vision-language-action (VLA) models on constrained edge hardware for warehouse telemetry and automated quality inspection.',
    55000, '$55,000 + Edge GPU DevKits',
    NOW() - INTERVAL '4 days', NOW() + INTERVAL '15 days 9 hours',
    'HYBRID', 'Bengaluru / Global Remote',
    ARRAY['AI', 'Hardware', 'Agents'],
    '[{"provider": "unstop", "url": "https://unstop.com/hackathons"}]'::jsonb,
    'https://unstop.com/hackathons',
    NULL,
    'SCOUTING', 0.91, TRUE, FALSE, 'APPROVED', 'ingestion'
  ),
  (
    'x-stealth-mcp-browser-runtime-bounty-2026-11',
    'Stealth Browser Runtime & Local MCP Server Bounty Thread',
    'stealth-browser-runtime-local-mcp-server-bounty',
    'OpenAI Devs & Indie Infrastructure Syndicate',
    '72-hour weekend bounty discovered on X for zero-config local MCP servers bridging browser DOM context into IDE coding agents.',
    15000, '$15,000 Instant USDC / Stripe Payout',
    NOW() - INTERVAL '6 hours', NOW() + INTERVAL '66 hours',
    'ONLINE', 'Global / X Thread',
    ARRAY['Agents', 'Open Source', 'SaaS / Web'],
    '[{"provider": "twitter", "url": "https://x.com/OpenAIDevs/status/189007778899001122"}]'::jsonb,
    'https://x.com/OpenAIDevs/status/189007778899001122',
    'https://x.com/OpenAIDevs/status/189007778899001122',
    'SCOUTING', 0.76, FALSE, FALSE, 'PENDING_REVIEW', 'ingestion'
  )
ON CONFLICT (fingerprint) DO NOTHING;

-- 3. ORBITAL WIRE NEWS ITEMS
INSERT INTO news_items (
  url_hash, title, source_name, source_url, category, gravity_take,
  impact_score, published_at, is_pinned, is_published, approval_status, created_by
)
VALUES
  (
    'deepmind-gemini-flash-structured-agent-loops-2026',
    'Gemini 2.5 Flash Sub-200ms Structured Schema Decoding & Parallel Tool Execution',
    'Google DeepMind',
    'https://deepmind.google/technologies/gemini/',
    'MODELS',
    'Constrained FSM schema decoding at sub-200ms time-to-first-token turns LLM normalization from an expensive background job into an inline request primitive. Builders can now replace brittle regex scrapers with deterministic JSON Schema extraction at <$0.04 per 1,000 ingestion runs.',
    97, NOW() - INTERVAL '38 minutes', TRUE, TRUE, 'APPROVED', 'ingestion'
  ),
  (
    'anthropic-mcp-remote-oauth-registry-spec-2026',
    'Model Context Protocol (MCP) Standardized Remote Transport & OAuth 2.1 Capability Discovery',
    'Anthropic Research',
    'https://www.anthropic.com/news',
    'AGENTS',
    'Standardizing stateless HTTP+SSE transport and scoped token exchange removes the local stdio bottleneck for enterprise MCP servers. Expect B2B SaaS integrations to collapse from months of custom REST glue into single-endpoint MCP manifest registrations.',
    94, NOW() - INTERVAL '2 hours', FALSE, TRUE, 'APPROVED', 'ingestion'
  ),
  (
    'arxiv-verifiable-multi-agent-consensus-2026',
    'arXiv:2611.08412: Deterministic Verification Gates Outperform Reflexion Loops in Multi-Agent Coding',
    'arXiv cs.AI',
    'https://arxiv.org/list/cs.AI/recent',
    'RESEARCH',
    'Empirical benchmarks across 4,200 repository tasks prove that pairing a fast generator model with strict compiler/AST verification gates beats 5x larger unverified reasoning chains by 31% while cutting token spend by 68%. Validate every agent output against a deterministic compiler or schema before advancing state.',
    92, NOW() - INTERVAL '4 hours', FALSE, TRUE, 'APPROVED', 'ingestion'
  ),
  (
    'vercel-nextjs-standalone-edge-workloads-2026',
    'Zero-Cold-Start Node & Standalone Containers for Long-Running AI Agent Streams',
    'Vercel Engineering',
    'https://vercel.com/blog',
    'DEVTOOLS',
    'Fluid compute memory sharing eliminates the historic trade-off between serverless auto-scaling and stateful multi-step agent execution. Architecting Next.js apps with standalone output guarantees identical behavior across Vercel and self-hosted Coolify/Docker clusters.',
    89, NOW() - INTERVAL '6 hours', FALSE, TRUE, 'APPROVED', 'ingestion'
  ),
  (
    'hn-sqlite-pgvector-hybrid-retrieval-latency-2026',
    'Show HN: Sub-8ms Hybrid BM25 + HNSW Vector Retrieval in Postgres Without External Sidecars',
    'Hacker News',
    'https://news.ycombinator.com',
    'OPEN_SOURCE',
    'Running reciprocal rank fusion directly inside PostgreSQL via GIN + pgvector indexes eliminates network serialization hops and dual-database drift. Keep your operational tables and semantic embeddings in a single transactional store until you exceed 50M rows.',
    88, NOW() - INTERVAL '9 hours', FALSE, TRUE, 'APPROVED', 'ingestion'
  ),
  (
    'openai-realtime-webrtc-function-calling-2026',
    'OpenAI Realtime WebRTC Transport Adds Interruptible Background Tool Execution',
    'OpenAI News',
    'https://openai.com/news',
    'AGENTS',
    'Asynchronous tool completion over WebRTC data channels allows voice and operations agents to keep conversing while slow ERP or payment queries resolve in the background. Critical primitive for SME operations agents like G-02 · OpsPilot.',
    90, NOW() - INTERVAL '13 hours', FALSE, TRUE, 'APPROVED', 'ingestion'
  ),
  (
    'github-trending-webcodecs-canvas-recorder-2026',
    'GitHub Trending: Hardware-Accelerated WebCodecs Frame Synthesizer for Deterministic UI Video Export',
    'GitHub Trending',
    'https://github.com/trending',
    'DEVTOOLS',
    'Stepping animation timelines frame-by-frame via VideoEncoder API produces bit-perfect 60fps MP4 exports directly in Chromium without server render farms. Directly validates the zero-marginal-cost rendering thesis behind G-03 · Kinetic Studio.',
    85, NOW() - INTERVAL '18 hours', FALSE, TRUE, 'APPROVED', 'ingestion'
  ),
  (
    'techcrunch-vertical-ai-foundries-outperform-wrappers-2026',
    'Enterprise Buyers Shift Budgets From Generic SaaS Seats to Outcome-Priced AI Systems Foundries',
    'TechCrunch AI',
    'https://techcrunch.com/category/artificial-intelligence/',
    'BUSINESS',
    'Mid-market and enterprise technical leads are bypassing seat-licensed AI wrappers in favor of bespoke, IP-transferred workflow systems that deploy in under 30 days. Productized 5-day audits paired with 4-week Velocity MVPs capture the highest conversion velocity.',
    87, NOW() - INTERVAL '22 hours', FALSE, TRUE, 'APPROVED', 'ingestion'
  )
ON CONFLICT (url_hash) DO NOTHING;

-- 4. JOURNAL LAB DISPATCHES (Issues 001..004)
INSERT INTO dispatches (
  issue_number, slug, title, subtitle, category, author_name, author_role,
  reading_time_mins, mdx_content, tags, is_featured, is_published,
  approval_status, created_by, published_at
)
VALUES
  (
    '004',
    'multi-provider-signal-extraction-x-hackathon-radar',
    'Multi-Provider Signal Extraction: Engineering a Deterministic + Gemini Flash Radar for X and Global Hackathons',
    'Why the highest-leverage AI hackathons break on X (Twitter) 72 hours before hitting aggregators, and how we built a fault-tolerant, cross-source deduplication pipeline to capture them.',
    'AI SYSTEMS',
    'Enwedo Akaolisa Gift',
    'Principal Architect · G-Gravitator & OXAKALABS',
    8,
    $$## The Discovery Asymmetry in Global Hackathons

Most builders discover hackathons only after they appear on legacy directory front pages. By then, half the registration window has evaporated. Inside **OXAKALABS · Skunkworks**, four years of 48-hour builds taught us a basic structural rule: **frontier AI sprints (from Cerebral Valley and Google DeepMind to Anthropic, Vercel, and protocol syndicates) are announced first as raw posts on X (Twitter) or Luma calendar links.**

When we architected the **G-Gravitator Live Hackathon Tracker (`/hackathons`)**, we refused to build another static link directory. We needed an aerospace-grade radar that unifies 10 distinct providers while staying resilient against API rate limits, noisy social chatter, and cross-posted duplicates.

## 1. The Multi-Tier X (Twitter) Adapter Pattern

Relying on a single social scraping endpoint is a guaranteed single point of failure. We structured `lib/ingestion/hackathons/twitter-adapter.ts` around a three-stage fallback cascade:

```typescript
// Canonical X Query Operator used by G-Gravitator
const X_HACKATHON_QUERY =
  '("hackathon" OR "buildathon") ("AI" OR "agents" OR "LLM" OR "prize" OR "$") ' +
  '(apply OR register OR lu.ma OR devpost OR dorahacks) -is:retweet lang:en';
```

1. **Primary Mode (`x_api`):** Queries X API v2 Recent Search every 6 hours across our operator grammar and high-signal monitored accounts (`@devpost`, `@DoraHacks`, `@lablabai`, `@cerebral_valley`, `@GoogleAI`, `@AnthropicAI`, `@OpenAIDevs`, `@vercel`, `@supabase`).
2. **Search Bridge Mode (`search_api` / `apify`):** Falls back to indexed `site:x.com` discovery when direct bearer quotas are constrained.
3. **Zero-Key Public Syndication & oEmbed Resolver:** Whenever an OXAKALABS scout or community builder pastes an `x.com` status URL into `POST /api/hackathons/submit`, our resolver extracts the tweet payload directly via X's public Syndication and oEmbed endpoints, expanding shortened `t.co` links before passing the text to normalization.

## 2. Two-Stage Noise Gate: Heuristics First, Gemini Flash Second

To prevent runaway LLM bills, raw feeds never touch the model unfiltered. Every candidate first passes a deterministic pre-filter:

- **Batch Ceiling:** Hard cap of 30 raw tweets and 40 news items per cron execution.
- **Temporal & Lexical Guard:** Rejects posts containing retrospective markers (*"congrats to the winners"*, *"recap of last weekend"*, *"demo day highlights"*) unless paired with an explicit upcoming registration deadline.

Survivors enter our structured normalization gate powered by **Gemini 3.8 Flash** (`@google/genai`) with a strict JSON Schema contract, backed by a deterministic heuristic parser when running offline.

Candidates scoring `>= 0.80` auto-publish to the live radar. Candidates between `0.50` and `0.79` route directly into the **Command Center (`/gg-command`)** moderation queue. Anything below `0.50` is dropped at the perimeter.

## 3. Cross-Source Fingerprint Deduplication

A major hackathon announced on X by `@GoogleAI` on Tuesday will appear on Devpost by Thursday. Naive aggregators render two separate cards.

Our deduplicator computes a dual key:
- **Lexical Fingerprint:** `normalize(titleTokens) + "::" + normalize(organizer) + "::" + YYYY_MM`
- **Canonical URL Fingerprint:** Stripping protocol, `www.`, query parameters, and trailing slashes from the resolved registration URL.

When an incoming X signal matches an existing Devpost record, we merge their `sources` JSONB arrays into a single database row, preserving the highest-confidence deadline and prize pool while rendering **both `DEVPOST` and `X` badges** on a single card.$$,
    ARRAY['GEMINI FLASH', 'INGESTION', 'DEDUPLICATION', 'X PIPELINE', 'SYSTEM DESIGN'],
    TRUE, TRUE, 'APPROVED', 'admin',
    NOW() - INTERVAL '1 day'
  ),
  (
    '003',
    'inside-the-48-hour-strike-loop-oxakalabs-graduation-filter',
    'Inside the 48-Hour Strike Loop: How OXAKALABS Hunts, Builds, and Graduates Hackathon Prototypes Into Commercial Drops',
    'Most hackathon teams ship slideware that rots on GitHub by Monday morning. Here is the 25-point mathematical filter we use to promote weekend experiments like DEMOPILOT into G-Gravitator Labs.',
    'HACKATHON LOG',
    'Enwedo Akaolisa Gift',
    'Founder · OXAKALABS & G-Gravitator',
    7,
    $$## Why We Elevated OXAKALABS Into G-Gravitator's Skunkworks

Founded in 2022, **OXAKALABS** was built as a high-velocity R&D sandbox and hackathon strike team. Over dozens of sprints (ranging from **DEMOPILOT** and the **All-Things-Agentic Harness** to **Aify Cycle** and the **Nexus Retail Operations Suite**), we noticed a recurring failure mode across the builder ecosystem: teams treat hackathons either as disposable theatrical demos or try to turn every weekend toy into a venture startup.

Both extremes waste engineering mass. Within **G-Gravitator**, OXAKALABS operates as our official **Skunkworks Foundry (`OXAKALABS · by G-Gravitator`)**, governed by a strict, unsentimental promotion protocol.

## The 25-Point Graduation Scorecard

Every Monday after a 48-hour sprint, the prototype is evaluated across five orthogonal axes scored from `1` to `5`:

1. **Pain Intensity (1–5):** Is this solving an acute, recurring operational bleed, or a novelty demo prompt?
2. **Willingness to Pay (1–5):** Can an enterprise buyer or prosumer immediately anchor this to saved engineering hours or revenue lift?
3. **Technical Moat & Craft (1–5):** Does the execution contain non-trivial state management, schema verification, or kinetic polish that generic wrappers cannot replicate in an afternoon?
4. **Distribution Hook (1–5):** Does the artifact market itself when shared (e.g., an interactive deck link, a benchmark badge, or an autonomous WhatsApp loop)?
5. **Solo / Lean Maintainability (1–5):** Can a 1-to-3 engineer cell operate and scale the unit without drowning in support debt?

```text
TOTAL SCORE 20–25 / 25  ==>  PROMOTE TO G-GRAVITATOR LABS (Numbered Drop G-XX)
TOTAL SCORE 14–19 / 25  ==>  PUBLISH AS B2B CASE STUDY & OPEN-SOURCE REPOSITORY
TOTAL SCORE < 14  / 25  ==>  WRITE POST-MORTEM DISPATCH & ARCHIVE CLEANLY
```

## Case Study: From OXA-01 (DEMOPILOT) to G-01 (GRAVITY DECK)

When we built **DEMOPILOT** (`github.com/Aka4real/DEMOPILOT`), the immediate goal was eliminating fragile video demos during technical judging. After testing it with founders who wanted the exact same kinetic, telemetry-backed micro-site engine for their seed pitches and enterprise architecture reviews, it scored **23/25** on the Graduation Filter, earning promotion into **G-01 · GRAVITY DECK**.$$,
    ARRAY['OXAKALABS', 'SKUNKWORKS', 'GRADUATION SCORECARD', 'DEMOPILOT', 'PRODUCT STRATEGY'],
    FALSE, TRUE, 'APPROVED', 'admin',
    NOW() - INTERVAL '5 days'
  ),
  (
    '002',
    '85-15-kinetic-luxury-specification-engineering-interfaces-with-mass',
    'The 85/15 Kinetic Luxury Specification: Engineering Interfaces With Physical Mass',
    'Rejecting purple-gradient AI slop in favor of Porsche Design structural silence, Teenage Engineering telemetry, and damped spring physics.',
    'DESIGN ENGINEERING',
    'Enwedo Akaolisa Gift',
    'Design Engineering Lead · G-Gravitator',
    6,
    $$## The Visual Crisis of Modern AI Software

Walk through fifty AI startup landing pages today and you will see the exact same template: purple-to-indigo radial blobs, floating glassmorphic cards with blurred borders, and centered three-column marketing clichés. It signals zero engineering weight.

When defining G-Gravitator's visual language, **Kinetic Luxury**, we looked outside software to industrial instruments that hold physical load: **Porsche Design chronographs, Teenage Engineering synthesizers, and Swiss aerospace schematics.**

## The 85 / 15 Allocation Rule

Every viewport across G-Gravitator obeys a strict compositional ratio:

- **85% Minimalist Luxury:** Architectural silence. An **Event Horizon (`#09090B`)** canvas divided by exposed `1px solid #27272A` Brushed Tungsten structural gridlines, pinned at key intersections by `9px × 9px` hairline `+` registration crosshairs. Zero muddy drop shadows; depth is communicated strictly through surface luminance step-ups (`#09090B` → `#111114` → `#18181B`).
- **15% Bold Kinetic:** Surgical bursts of **Ion Signal (`#FF3B1F`)** reserved exclusively for primary conversion vectors, urgent `< 48h` hackathon countdowns, and active telemetry nodes, paired with physically weighted motion.

```typescript
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
```

Notice the `mass: 1.2` parameter on our primary spring preset. Cheap animations feel weightless because they use low mass and under-damped bounce. By increasing virtual mass and critical damping, elements (from the stretched **`G-GRAVITATOR`** spacetime vector wordmark to our magnetic CTAs) accelerate with deliberate inertia and lock into place with mechanical certainty.$$,
    ARRAY['KINETIC LUXURY', 'DESIGN SYSTEM', 'FRAMER MOTION', 'TYPOGRAPHY', 'UI ARCHITECTURE'],
    FALSE, TRUE, 'APPROVED', 'admin',
    NOW() - INTERVAL '9 days'
  ),
  (
    '001',
    'center-of-mass-why-we-built-g-gravitator',
    'Center of Mass: Why We Built G-Gravitator & The Four-Unit Operating Flywheel',
    'Most labs either chase aesthetics with no engine underneath, or ship raw engineering nobody wants to touch. G-Gravitator exists where software craftsmanship, applied AI, and radical creativity collide.',
    'ARCHITECTURE',
    'Enwedo Akaolisa Gift',
    'Founder · G-Gravitator Labs Ltd',
    5,
    $$## Build With Weight

Great ideas, elite talent, and capital naturally bend toward high-mass builders. Just as Y Combinator turned a mathematical fixed-point combinator into an unmistakable badge of builder credibility, **G-Gravitator** uses orbital physics as its cultural and engineering shorthand: a laboratory where raw ideas gain enough engineering mass to pull markets toward them.

## One Masterbrand, Four Interlocking Units

Consultancies stall because client work starves internal products. Product studios stall because they run out of capital waiting for a hit. Hackathon teams stall because their best prototypes die on Sunday night.

We architected G-Gravitator as a closed-loop four-unit flywheel:

1. **G-Gravitator Systems (`/systems`):** High-ticket B2B foundry delivering 5-day Gravity Audits, 4-week Velocity MVPs, and fractional R&D retainers. Generates non-dilutive cashflow and exposes us directly to enterprise operational bottlenecks.
2. **OXAKALABS · Skunkworks (`/skunkworks` & `/hackathons`):** Our 48-hour experimental R&D foundry and global hackathon strike arm. Stress-tests frontier models and agent protocols under extreme time compression.
3. **G-Gravitator Labs (`/labs`):** Ships proprietary software and AI tools as numbered industrial drops (`G-01` through `G-04`), seeded by the highest-scoring prototypes graduating from OXAKALABS and battle-tested patterns from Systems.
4. **G-Gravitator Orbit (`/orbit`):** Selective 6-week technical training cohorts (*Gravity Cycles*) that pull the sharpest emerging engineers and design technologists directly into our ecosystem.$$,
    ARRAY['MANIFESTO', 'FLYWHEEL', 'SYSTEMS', 'LABS', 'ORBIT'],
    FALSE, TRUE, 'APPROVED', 'admin',
    NOW() - INTERVAL '14 days'
  )
ON CONFLICT (slug) DO NOTHING;
