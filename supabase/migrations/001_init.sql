-- =============================================================================
-- G-GRAVITATOR — MASTER POSTGRESQL / SUPABASE SCHEMA (001_init.sql)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. HACKATHONS (Unified Multi-Provider + X/Twitter Schema)
CREATE TABLE IF NOT EXISTS hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT UNIQUE NOT NULL, -- Deduplication hash
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  organizer TEXT NOT NULL,
  summary TEXT NOT NULL,
  prize_pool_usd INTEGER,           -- Normalized integer for sorting
  prize_display TEXT,               -- e.g. "$50,000 + API Credits"
  start_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('ONLINE', 'IN_PERSON', 'HYBRID')),
  location TEXT DEFAULT 'Global / Remote',
  themes TEXT[] DEFAULT '{}',       -- e.g. {'AI', 'Agents', 'Web3'}
  sources JSONB NOT NULL DEFAULT '[]', -- e.g. [{"provider": "devpost", "url": "..."}, {"provider": "twitter", "url": "..."}]
  primary_url TEXT NOT NULL,
  source_tweet_url TEXT,
  image_url TEXT,
  oxakalabs_status TEXT DEFAULT 'NONE' CHECK (oxakalabs_status IN ('NONE', 'SCOUTING', 'SQUAD_DEPLOYED', 'SUBMITTED', 'WON')),
  confidence_score REAL DEFAULT 1.0,
  is_published BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hackathons_deadline ON hackathons (deadline_at ASC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_hackathons_prize ON hackathons (prize_pool_usd DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_hackathons_themes ON hackathons USING GIN (themes);

-- 2. AI & TECH NEWS ITEMS (The Orbital Wire)
CREATE TABLE IF NOT EXISTS news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_hash TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  source_name TEXT NOT NULL,        -- e.g. "Google DeepMind", "Hacker News", "arXiv", "X"
  source_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('MODELS', 'AGENTS', 'DEVTOOLS', 'RESEARCH', 'BUSINESS', 'OPEN_SOURCE')),
  gravity_take TEXT NOT NULL,       -- 2-sentence AI-synthesized builder takeaway
  impact_score INTEGER DEFAULT 50 CHECK (impact_score BETWEEN 1 AND 100),
  published_at TIMESTAMPTZ NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_items (published_at DESC) WHERE is_published = TRUE;

-- 3. LAB DISPATCHES (Original Long-Form Journals)
CREATE TABLE IF NOT EXISTS dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number TEXT UNIQUE NOT NULL, -- e.g. "001", "002"
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  category TEXT NOT NULL,            -- ARCHITECTURE, POST-MORTEM, HACKATHON LOG, AI SYSTEMS, DESIGN ENGINEERING
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  reading_time_mins INTEGER NOT NULL,
  cover_image_url TEXT,
  mdx_content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LABS PRODUCTS & SKUNKWORKS EXPERIMENTS
CREATE TABLE IF NOT EXISTS lab_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,         -- e.g. "G-01", "OXA-01"
  division TEXT NOT NULL CHECK (division IN ('LABS', 'SKUNKWORKS')),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,              -- CONCEPT, PROTOTYPING, R&D, SKUNKWORKS CANDIDATE, BETA, LIVE, ARCHIVED
  tech_stack TEXT[] DEFAULT '{}',
  live_url TEXT,
  repo_url TEXT,
  hackathon_origin TEXT,             -- Optional link to hackathon where it was born
  scorecard JSONB,                   -- Optional 5-metric 25-pt graduation scorecard
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. B2B SYSTEMS INQUIRIES
CREATE TABLE IF NOT EXISTS client_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('GRAVITY_AUDIT', 'VELOCITY_MVP', 'LAB_RETAINER', 'CUSTOM')),
  budget_range TEXT,
  timeline TEXT,
  project_brief TEXT NOT NULL,
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWED', 'DISCOVERY_CALL', 'CLOSED_WON', 'ARCHIVED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORBIT COHORT WAITLIST & NEWSLETTER
CREATE TABLE IF NOT EXISTS orbit_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('AI_ENGINEERING', 'FULLSTACK_SYSTEMS', 'KINETIC_DESIGN')),
  portfolio_url TEXT,
  proof_of_work TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'journal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE orbit_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read access ONLY for published content
CREATE POLICY "Public can view published hackathons"
  ON hackathons FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Public can view published news_items"
  ON news_items FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Public can view published dispatches"
  ON dispatches FOR SELECT
  USING (published_at IS NOT NULL);

CREATE POLICY "Public can view lab_projects"
  ON lab_projects FOR SELECT
  USING (TRUE);
