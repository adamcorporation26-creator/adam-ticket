-- ==============================================================================
-- SUPABASE DATABASE SCHEMA FOR ADAM TICKET KING BOT & WEB DASHBOARD
-- Run this in your Supabase Project: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. PANELS TABLE (Ticket panel embed configs, buttons, styling)
CREATE TABLE IF NOT EXISTS panels (
  id TEXT PRIMARY KEY,
  name TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TICKETS TABLE (Active, in-progress, and resolved tickets)
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  ticket_number INT,
  ticket_name TEXT,
  topic TEXT,
  status TEXT DEFAULT 'open',
  channel_id TEXT,
  guild_id TEXT,
  author_id TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. SETTINGS TABLE (Server configurations, support roles, log channels)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. AUDIT LOGS TABLE (Dashboard & ticket history activity)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY,
  action TEXT,
  details TEXT,
  user_name TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexing for fast search and filtering
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_guild ON tickets(guild_id);
CREATE INDEX IF NOT EXISTS idx_tickets_author ON tickets(author_id);
CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets(channel_id);

-- ==============================================================================
-- SECURITY & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- When using SUPABASE_SERVICE_ROLE_KEY in .env, the backend bypasses RLS automatically.
-- Enable RLS to prevent public access via the Anon Key from exposing sensitive ticket data:
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow Service Role full access to all tables:
CREATE POLICY "Service Role Full Access on panels" ON panels FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access on tickets" ON tickets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access on settings" ON settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access on audit_logs" ON audit_logs FOR ALL USING (auth.role() = 'service_role');

-- If you only have SUPABASE_ANON_KEY (development only), you can optionally disable RLS:
-- ALTER TABLE panels DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
