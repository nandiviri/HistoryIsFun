CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'versus',
  story_ids TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  invited_at INTEGER,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE party_members (
  story_id TEXT PRIMARY KEY,
  member TEXT NOT NULL,
  trail TEXT,
  joined_at INTEGER NOT NULL
);
