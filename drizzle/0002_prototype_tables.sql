DROP TABLE entries;
--> statement-breakpoint
CREATE TABLE user_state (
  id INTEGER PRIMARY KEY,
  membership TEXT NOT NULL DEFAULT 'free',
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_study_date TEXT,
  plan TEXT
);
--> statement-breakpoint
CREATE TABLE completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id TEXT NOT NULL,
  quiz_score INTEGER NOT NULL DEFAULT 0,
  quiz_total INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE generated_stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  figure TEXT NOT NULL,
  era TEXT NOT NULL,
  summary TEXT NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 5,
  chapters TEXT NOT NULL,
  quiz TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
