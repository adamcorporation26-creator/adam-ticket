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

-- Disable RLS (Row Level Security) so the Node.js backend can read and write with service/anon keys
ALTER TABLE panels DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
