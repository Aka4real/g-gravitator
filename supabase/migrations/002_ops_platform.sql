-- =============================================================================
-- G-GRAVITATOR — OPS COMMAND CENTER, MEDIA, AI PERMISSIONS & MCP (002_ops_platform.sql)
-- =============================================================================

-- Extend existing content tables with approval workflow, authorship, and rich visual design metadata
ALTER TABLE dispatches
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS design JSONB;

ALTER TABLE news_items
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'ingestion',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS design JSONB,
  ADD COLUMN IF NOT EXISTS related_links JSONB DEFAULT '[]';

ALTER TABLE hackathons
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'ingestion',
  ADD COLUMN IF NOT EXISTS design JSONB,
  ADD COLUMN IF NOT EXISTS related_links JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

ALTER TABLE orbit_waitlist
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE lab_projects
  ADD COLUMN IF NOT EXISTS thesis TEXT,
  ADD COLUMN IF NOT EXISTS architecture_notes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS changelog JSONB DEFAULT '[]';

ALTER POLICY "Public can view published dispatches"
  ON dispatches
  USING (COALESCE(is_published, TRUE) = TRUE AND published_at IS NOT NULL);

-- Admin user accounts (service-role access only)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Single-use admin signup invite codes
CREATE TABLE IF NOT EXISTS admin_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  used_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stored media assets (generated, URL-imported, or uploaded)
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL,
  data_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('generated', 'imported', 'uploaded')),
  source_url TEXT,
  prompt TEXT,
  alt_text TEXT,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System settings (e.g. AI permissions policy)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- External MCP bearer tokens
CREATE TABLE IF NOT EXISTS mcp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  prefix TEXT NOT NULL,
  permissions_mode TEXT NOT NULL DEFAULT 'inherit' CHECK (permissions_mode IN ('inherit', 'full', 'readonly')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Admin / AI / MCP audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('admin', 'ai_assistant', 'mcp')),
  actor_label TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'denied', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
