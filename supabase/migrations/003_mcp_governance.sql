-- =============================================================================
-- G-GRAVITATOR — EXTERNAL MCP GOVERNANCE, SCOPES, TELEMETRY & RATE LIMITS (003_mcp_governance.sql)
-- =============================================================================

ALTER TABLE mcp_tokens
  ADD COLUMN IF NOT EXISTS role_preset TEXT DEFAULT 'inherit',
  ADD COLUMN IF NOT EXISTS custom_scopes JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rate_limit_rpm INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS request_count BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS denied_count BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_client_info TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE mcp_tokens DROP CONSTRAINT IF EXISTS mcp_tokens_permissions_mode_check;
ALTER TABLE mcp_tokens
  ADD CONSTRAINT mcp_tokens_permissions_mode_check
  CHECK (permissions_mode IN ('inherit', 'full', 'readonly', 'custom'));

CREATE INDEX IF NOT EXISTS idx_mcp_tokens_hash_active
  ON mcp_tokens (token_hash)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created
  ON audit_logs (actor_type, created_at DESC);
