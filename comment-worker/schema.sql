CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,       -- 'github' | 'google'
  provider_id TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(provider, provider_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,       -- 64 random hex chars (256 bits)
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at INTEGER DEFAULT (unixepoch())
  -- No expiry: sessions live forever in DB; cookie Max-Age handles client-side expiry
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL CHECK(length(content) <= 5000),
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(post_slug);
