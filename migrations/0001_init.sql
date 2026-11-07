-- D1 schema for EZ EXHIBITZ.
-- Mirrors db/schema.json (the share_links table, submit access) and adds what the
-- backend needs to serve it: form entries and upload accounting for the daily caps.

CREATE TABLE IF NOT EXISTS form_submissions (
  id         TEXT PRIMARY KEY,
  form       TEXT NOT NULL,
  data       TEXT NOT NULL DEFAULT '{}',
  ip_hash    TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS form_submissions_form ON form_submissions (form, created_at);
CREATE INDEX IF NOT EXISTS form_submissions_ip ON form_submissions (ip_hash, created_at);

CREATE TABLE IF NOT EXISTS share_links (
  id         TEXT PRIMARY KEY,
  url        TEXT NOT NULL,
  file_name  TEXT,
  page_count INTEGER,
  action     TEXT NOT NULL DEFAULT 'created',
  remove_by  TEXT,
  ip_hash    TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS share_links_created ON share_links (created_at);
CREATE INDEX IF NOT EXISTS share_links_url ON share_links (url);

-- One row per stored file: the daily upload cap and a record of what is in R2.
CREATE TABLE IF NOT EXISTS uploads (
  id         TEXT PRIMARY KEY,
  file_name  TEXT,
  size       INTEGER NOT NULL DEFAULT 0,
  ip_hash    TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS uploads_ip ON uploads (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS uploads_expires ON uploads (expires_at);
