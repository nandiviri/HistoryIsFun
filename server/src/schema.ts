import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userState = sqliteTable("user_state", {
  id: integer("id").primaryKey(),
  membership: text("membership", { enum: ["free", "pro"] }).notNull().default("free"),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastStudyDate: text("last_study_date"),
  plan: text("plan"),
});

export const completions = sqliteTable("completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  storyId: text("story_id").notNull(),
  quizScore: integer("quiz_score").notNull().default(0),
  quizTotal: integer("quiz_total").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  completedAt: integer("completed_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const generatedStories = sqliteTable("generated_stories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  topic: text("topic").notNull(),
  title: text("title").notNull(),
  figure: text("figure").notNull(),
  era: text("era").notNull(),
  summary: text("summary").notNull(),
  minutes: integer("minutes").notNull().default(5),
  chapters: text("chapters").notNull(),
  quiz: text("quiz").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  mode: text("mode", { enum: ["versus", "cooperative"] }).notNull().default("versus"),
  storyIds: text("story_ids").notNull(),
  inviteCode: text("invite_code").notNull(),
  invitedAt: integer("invited_at", { mode: "timestamp_ms" }),
  // World-domination conquest game state (null board = legacy lobby-only campaign)
  board: text("board"),
  rivals: text("rivals"),
  log: text("log"),
  status: text("status", { enum: ["lobby", "active", "won", "lost"] }).notNull().default("lobby"),
  round: integer("round").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const partyMembers = sqliteTable("party_members", {
  storyId: text("story_id").primaryKey(),
  member: text("member").notNull(),
  trail: text("trail"),
  joinedAt: integer("joined_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
