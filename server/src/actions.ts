import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { desc, eq } from "drizzle-orm";
import * as schema from "./schema";

const chapterSchema = z.object({ heading: z.string(), text: z.string() });
const quizSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

const generatedStorySchema = z.object({
  id: z.number(),
  topic: z.string(),
  title: z.string(),
  figure: z.string(),
  era: z.string(),
  summary: z.string(),
  minutes: z.number(),
  chapters: z.array(chapterSchema),
  quiz: z.array(quizSchema),
  created_at: z.string(),
});

const boardTerritorySchema = z.object({ id: z.string(), owner: z.string(), hero: z.string().nullable() });
const rivalSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  color: z.string(),
  heroIds: z.array(z.string()),
});

const campaignSchema = z.object({
  id: z.number(),
  name: z.string(),
  mode: z.enum(["versus", "cooperative"]),
  storyIds: z.array(z.string()),
  inviteCode: z.string(),
  invitedAt: z.string().nullable(),
  board: z.array(boardTerritorySchema).nullable(),
  rivals: z.array(rivalSchema),
  log: z.array(z.string()),
  status: z.enum(["lobby", "active", "won", "lost"]),
  round: z.number(),
  created_at: z.string(),
});

type CampaignOut = z.infer<typeof campaignSchema>;
type BoardTerritory = z.infer<typeof boardTerritorySchema>;
type Rival = z.infer<typeof rivalSchema>;

/* ------- World-domination conquest board (server copy for validation) ------- */

const TERRITORIES: { id: string; name: string }[] = [
  { id: "egypt", name: "Egypt" }, { id: "rome", name: "Rome" }, { id: "greece", name: "Greece" }, { id: "mesopotamia", name: "Mesopotamia" },
  { id: "mongolia", name: "Mongolia" }, { id: "france", name: "France" }, { id: "england", name: "England" }, { id: "arabia", name: "Arabia" },
  { id: "italy", name: "Italy" }, { id: "spain", name: "Spain" }, { id: "germany", name: "Germany" }, { id: "netherlands", name: "Netherlands" },
  { id: "america", name: "America" }, { id: "mexico", name: "Mexico" }, { id: "poland", name: "Poland" }, { id: "japan", name: "Japan" },
];
const TERRITORY_NAME: Record<string, string> = Object.fromEntries(TERRITORIES.map((t) => [t.id, t.name]));

const BOARD_LINKS: [string, string][] = [
  ["egypt", "rome"], ["rome", "greece"], ["greece", "mesopotamia"], ["mesopotamia", "egypt"], ["egypt", "greece"],
  ["france", "england"], ["england", "mongolia"], ["mongolia", "arabia"], ["arabia", "france"], ["france", "mongolia"],
  ["italy", "spain"], ["spain", "germany"], ["germany", "netherlands"], ["netherlands", "italy"], ["italy", "germany"],
  ["america", "mexico"], ["mexico", "poland"], ["poland", "japan"], ["japan", "america"], ["america", "poland"],
  ["rome", "italy"], ["greece", "italy"], ["egypt", "arabia"], ["mesopotamia", "arabia"], ["mongolia", "poland"],
  ["france", "spain"], ["england", "netherlands"], ["england", "america"], ["spain", "mexico"], ["japan", "mongolia"],
];
const ADJACENCY: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const t of TERRITORIES) map[t.id] = [];
  for (const [a, b] of BOARD_LINKS) {
    map[a]?.push(b);
    map[b]?.push(a);
  }
  return map;
})();

/** Rival commanders who fill the other seats in this prototype. Their heroes
 *  are catalog figures — the questions a player must answer to advance are
 *  drawn from those heroes' stories. */
const RIVALS: Rival[] = [
  { id: "ada", name: "Ada the Archivist", emoji: "🧠", color: "#0284c7", heroIds: ["leonardo", "curie", "tesla"] },
  { id: "marco", name: "Marco the Merciless", emoji: "⚔️", color: "#dc2626", heroIds: ["caesar", "genghis", "joan"] },
  { id: "sofia", name: "Sofia the Storm", emoji: "🌪️", color: "#7c3aed", heroIds: ["cleopatra", "tubman", "lincoln", "kahlo"] },
];
const PLAYER_ID = "you";
const RIVAL_WIN_CHANCE = 0.42;

function campaignOut(c: typeof schema.campaigns.$inferSelect): CampaignOut {
  return {
    id: c.id,
    name: c.name,
    mode: c.mode,
    storyIds: JSON.parse(c.storyIds) as string[],
    inviteCode: c.inviteCode,
    invitedAt: c.invitedAt ? c.invitedAt.toISOString() : null,
    board: c.board ? (JSON.parse(c.board) as BoardTerritory[]) : null,
    rivals: c.rivals ? (JSON.parse(c.rivals) as Rival[]) : [],
    log: c.log ? (JSON.parse(c.log) as string[]) : [],
    status: c.status,
    round: c.round,
    created_at: c.createdAt.toISOString(),
  };
}

function dbOf(ctx: Ctx) {
  return ctx.db<typeof schema>();
}
type Db = ReturnType<typeof dbOf>;

async function makeInviteCode(db: Db): Promise<string> {
  const words = ["EAGLE", "LION", "WOLF", "BEAR", "HAWK", "FALCON", "OTTER", "IBIS"];
  let code = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    const word = words[Math.floor(Math.random() * words.length)]!;
    code = `${word}-${Math.floor(1000 + Math.random() * 9000)}`;
    const clash = await db.select().from(schema.campaigns).where(eq(schema.campaigns.inviteCode, code)).limit(1);
    if (clash.length === 0) break;
  }
  return code;
}

const partyMemberSchema = z.object({
  storyId: z.string(),
  member: z.string(),
  trail: z.string().nullable(),
  joinedAt: z.string(),
});

const stateResponse = z.object({
  membership: z.enum(["free", "pro"]),
  plan: z.string().nullable(),
  xp: z.number(),
  streak: z.number(),
  lastStudyDate: z.string().nullable(),
  completions: z.array(
    z.object({
      storyId: z.string(),
      quizScore: z.number(),
      quizTotal: z.number(),
      xpEarned: z.number(),
      completedAt: z.string(),
    }),
  ),
  generated: z.array(generatedStorySchema),
  campaigns: z.array(campaignSchema),
  party: z.array(partyMemberSchema),
});

type StateResponse = z.infer<typeof stateResponse>;

async function loadState(ctx: Ctx): Promise<StateResponse> {
  const db = ctx.db<typeof schema>();
  let rows = await db.select().from(schema.userState).limit(1);
  if (rows.length === 0) {
    await db.insert(schema.userState).values({ id: 1, membership: "free", xp: 0, streak: 0 }).onConflictDoNothing();
    rows = await db.select().from(schema.userState).limit(1);
  }
  const state = rows[0]!;
  const comps = await db.select().from(schema.completions).orderBy(desc(schema.completions.id));
  const gens = await db.select().from(schema.generatedStories).orderBy(desc(schema.generatedStories.id));
  const camps = await db.select().from(schema.campaigns).orderBy(desc(schema.campaigns.id));
  const party = await db.select().from(schema.partyMembers).orderBy(schema.partyMembers.joinedAt);
  return {
    membership: state.membership,
    plan: state.plan ?? null,
    xp: state.xp,
    streak: state.streak,
    lastStudyDate: state.lastStudyDate ?? null,
    completions: comps.map((c) => ({
      storyId: c.storyId,
      quizScore: c.quizScore,
      quizTotal: c.quizTotal,
      xpEarned: c.xpEarned,
      completedAt: c.completedAt.toISOString(),
    })),
    generated: gens.map((g) => ({
      id: g.id,
      topic: g.topic,
      title: g.title,
      figure: g.figure,
      era: g.era,
      summary: g.summary,
      minutes: g.minutes,
      chapters: JSON.parse(g.chapters) as z.infer<typeof chapterSchema>[],
      quiz: JSON.parse(g.quiz) as z.infer<typeof quizSchema>[],
      created_at: g.createdAt.toISOString(),
    })),
    campaigns: camps.map(campaignOut),
    party: party.map((p) => ({
      storyId: p.storyId,
      member: p.member,
      trail: p.trail ?? null,
      joinedAt: p.joinedAt.toISOString(),
    })),
  };
}

export const Actions = {
  getState: defineAction({
    description: "Returns membership, XP, streak, story completions, AI-generated stories, multiplayer campaigns, and the battle party of unlocked hero avatars.",
    request: z.object({}),
    response: stateResponse,
    async handler(ctx): Promise<StateResponse> {
      return loadState(ctx);
    },
  }),

  completeStory: defineAction({
    description: "Records a finished story and quiz, awards XP, and updates the daily streak.",
    request: z.object({
      storyId: z.string().min(1),
      quizScore: z.number().int().min(0).max(20),
      quizTotal: z.number().int().min(1).max(20),
      today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    response: z.object({ xpEarned: z.number(), totalXp: z.number(), streak: z.number(), alreadyCompleted: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const state = await loadState(ctx);
      const already = state.completions.some((c) => c.storyId === args.storyId);
      const xpEarned = already ? 5 : 20 + args.quizScore * 10;
      // streak logic
      let streak = state.streak;
      if (state.lastStudyDate !== args.today) {
        const yesterday = new Date(`${args.today}T00:00:00`);
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = yesterday.toISOString().slice(0, 10);
        streak = state.lastStudyDate === yKey ? streak + 1 : 1;
      }
      const totalXp = state.xp + xpEarned;
      await db
        .update(schema.userState)
        .set({ xp: totalXp, streak, lastStudyDate: args.today })
        .where(eq(schema.userState.id, 1));
      await db.insert(schema.completions).values({
        storyId: args.storyId,
        quizScore: args.quizScore,
        quizTotal: args.quizTotal,
        xpEarned,
      });
      ctx.invalidateQueries();
      return { xpEarned, totalXp, streak, alreadyCompleted: already };
    },
  }),

  generateStory: defineAction({
    description: "Uses AI to generate a new 5-minute history story with chapters and a quiz for any figure or event.",
    request: z.object({ topic: z.string().min(2).max(120) }),
    response: z.object({ story: generatedStorySchema }),
    async handler(ctx, args) {
      const genSchema = z.object({
        title: z.string(),
        figure: z.string(),
        era: z.string(),
        summary: z.string(),
        chapters: z.array(chapterSchema).min(3).max(5),
        quiz: z.array(quizSchema).length(3),
      });
      const result = await ctx.inference.complete(
        `Write a captivating 5-minute history story about: ${args.topic}. Write for a curious adult listening on a phone. Use only well-established historical facts — real dates, places, and events; do not invent quotes or statistics. Structure: a vivid title, the central figure or subject, the historical era (e.g. Ancient World, Medieval, Renaissance, Modern), a one-sentence summary, 4 short chapters each with a heading and 2-3 sentences of narrative, and exactly 3 multiple-choice quiz questions whose answers are stated in the chapters, each with 4 options and a one-sentence explanation of the correct answer.`,
        { schema: genSchema },
      );
      const db = ctx.db<typeof schema>();
      const inserted = await db
        .insert(schema.generatedStories)
        .values({
          topic: args.topic,
          title: result.title,
          figure: result.figure,
          era: result.era,
          summary: result.summary,
          minutes: 5,
          chapters: JSON.stringify(result.chapters),
          quiz: JSON.stringify(result.quiz),
        })
        .returning();
      const row = inserted[0]!;
      ctx.invalidateQueries();
      return {
        story: {
          id: row.id,
          topic: row.topic,
          title: row.title,
          figure: row.figure,
          era: row.era,
          summary: row.summary,
          minutes: row.minutes,
          chapters: result.chapters,
          quiz: result.quiz,
          created_at: row.createdAt.toISOString(),
        },
      };
    },
  }),

  setMembership: defineAction({
    description: "Switches the prototype membership tier (free or pro) and optional plan.",
    request: z.object({
      membership: z.enum(["free", "pro"]),
      plan: z.string().max(40).nullable().optional(),
    }),
    response: z.object({ membership: z.enum(["free", "pro"]) }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      await loadState(ctx);
      await db
        .update(schema.userState)
        .set({ membership: args.membership, plan: args.plan ?? null })
        .where(eq(schema.userState.id, 1));
      ctx.invalidateQueries();
      return { membership: args.membership };
    },
  }),

  deleteGenerated: defineAction({
    description: "Deletes one AI-generated story.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.generatedStories).where(eq(schema.generatedStories.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  toggleParty: defineAction({
    description: "Adds an unlocked hero avatar to the battle party, or benches one already in it. Only heroes whose story the player has completed can join.",
    request: z.object({
      storyId: z.string().min(1).max(80),
      member: z.string().min(1).max(80),
      inParty: z.boolean(),
      trail: z.string().max(200).nullable().optional(),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.partyMembers).where(eq(schema.partyMembers.storyId, args.storyId));
      if (args.inParty) {
        // A hero can only fight in multiplayer once its story is finished.
        const done = await db
          .select()
          .from(schema.completions)
          .where(eq(schema.completions.storyId, args.storyId))
          .limit(1);
        if (done.length === 0) return { ok: true };
        await db.insert(schema.partyMembers).values({
          storyId: args.storyId,
          member: args.member,
          trail: args.trail ?? null,
        });
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  createCampaign: defineAction({
    description: "Creates a multiplayer campaign from 2–5 quests with a mode (versus or cooperative) and a shareable invite code.",
    request: z.object({
      name: z.string().min(2).max(60),
      mode: z.enum(["versus", "cooperative"]),
      storyIds: z.array(z.string().min(1).max(80)).min(2).max(5),
    }),
    response: z.object({ campaign: campaignSchema }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const code = await makeInviteCode(db);
      const inserted = await db
        .insert(schema.campaigns)
        .values({
          name: args.name.trim(),
          mode: args.mode,
          storyIds: JSON.stringify(args.storyIds),
          inviteCode: code,
        })
        .returning();
      const row = inserted[0]!;
      ctx.invalidateQueries();
      return { campaign: campaignOut(row) };
    },
  }),

  createMatch: defineAction({
    description: "Starts a world-domination conquest match: deals the 16-territory board between the player and three rival commanders, garrisoning each territory with one of its owner's unlocked heroes.",
    request: z.object({
      name: z.string().min(2).max(60),
      heroIds: z.array(z.string().min(1).max(80)).min(1).max(12),
    }),
    response: z.object({ campaign: campaignSchema }),
    async handler(ctx, args): Promise<{ campaign: CampaignOut }> {
      const db = ctx.db<typeof schema>();
      // Only heroes the player actually unlocked (completed stories) can fight.
      const compRows = await db.select({ storyId: schema.completions.storyId }).from(schema.completions);
      const unlocked = new Set(compRows.map((r) => r.storyId));
      const heroes = [...new Set(args.heroIds)].filter((id) => unlocked.has(id));
      if (heroes.length === 0) throw new Error("Unlock at least one hero before starting a conquest match.");
      // Deal the board round-robin after a shuffle: 4 territories each.
      const ids = TERRITORIES.map((t) => t.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j]!, ids[i]!];
      }
      const owners = [PLAYER_ID, ...RIVALS.map((r) => r.id)];
      const rosters: Record<string, string[]> = { [PLAYER_ID]: heroes };
      for (const r of RIVALS) rosters[r.id] = r.heroIds;
      const counters: Record<string, number> = {};
      const board: BoardTerritory[] = ids.map((id, i) => {
        const owner = owners[i % owners.length]!;
        const roster = rosters[owner]!;
        const n = counters[owner] ?? 0;
        counters[owner] = n + 1;
        return { id, owner, hero: roster[n % roster.length]! };
      });
      const code = await makeInviteCode(db);
      const inserted = await db
        .insert(schema.campaigns)
        .values({
          name: args.name.trim(),
          mode: "versus",
          storyIds: JSON.stringify(heroes),
          inviteCode: code,
          board: JSON.stringify(board),
          rivals: JSON.stringify(RIVALS),
          log: JSON.stringify([
            `🌍 ${args.name.trim()} begins — 16 territories, 4 commanders. Conquer territory by answering questions about the hero who holds it.`,
          ]),
          status: "active",
          round: 1,
        })
        .returning();
      const row = inserted[0]!;
      ctx.invalidateQueries();
      return { campaign: campaignOut(row) };
    },
  }),

  attack: defineAction({
    description: "Resolves one conquest attack: the player answered questions about the defending hero; 2+ correct conquers the territory. Rival commanders then take their turns, and the updated match is returned.",
    request: z.object({
      campaignId: z.number().int().positive(),
      targetId: z.string().min(1).max(40),
      heroStoryId: z.string().min(1).max(80),
      correct: z.number().int().min(0).max(3),
    }),
    response: z.object({
      campaign: campaignSchema,
      outcome: z.enum(["conquered", "repelled"]),
      events: z.array(z.string()),
      xpEarned: z.number(),
    }),
    async handler(ctx, args): Promise<{ campaign: CampaignOut; outcome: "conquered" | "repelled"; events: string[]; xpEarned: number }> {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, args.campaignId)).limit(1);
      const row = rows[0];
      if (!row || !row.board || row.status !== "active") throw new Error("That match isn't active.");
      const board = JSON.parse(row.board) as BoardTerritory[];
      const rivals = row.rivals ? (JSON.parse(row.rivals) as Rival[]) : RIVALS;
      const oldLog = row.log ? (JSON.parse(row.log) as string[]) : [];
      const target = board.find((t) => t.id === args.targetId);
      if (!target || target.owner === PLAYER_ID) throw new Error("That territory can't be attacked.");
      const bordersMine = (ADJACENCY[args.targetId] ?? []).some((n) => board.find((t) => t.id === n)?.owner === PLAYER_ID);
      if (!bordersMine) throw new Error("That territory doesn't border your empire yet.");
      // The attacking hero must be one the player unlocked.
      const compRows = await db.select({ storyId: schema.completions.storyId }).from(schema.completions);
      const unlocked = new Set(compRows.map((r) => r.storyId));
      if (!unlocked.has(args.heroStoryId)) throw new Error("That hero hasn't been unlocked.");

      const ownerName = (id: string) => (id === PLAYER_ID ? "You" : rivals.find((r) => r.id === id)?.name ?? id);
      const events: string[] = [];
      let xpEarned = 0;
      let status: CampaignOut["status"] = "active";

      const conquered = args.correct >= 2;
      const outcome: "conquered" | "repelled" = conquered ? "conquered" : "repelled";
      if (conquered) {
        target.owner = PLAYER_ID;
        target.hero = args.heroStoryId;
        xpEarned += 15;
        events.push(`🏴 You conquered ${TERRITORY_NAME[args.targetId]} (${args.correct}/3 correct about its hero). +15 XP`);
      } else {
        events.push(`🛡️ Your attack on ${TERRITORY_NAME[args.targetId]} was repelled (${args.correct}/3 correct about its hero).`);
      }

      const countFor = (id: string) => board.filter((t) => t.owner === id).length;
      const checkEnd = (): boolean => {
        if (countFor(PLAYER_ID) === board.length) {
          status = "won";
          xpEarned += 100;
          events.push("👑 WORLD DOMINATION! You hold every territory. +100 XP");
          return true;
        }
        if (countFor(PLAYER_ID) === 0) {
          status = "lost";
          events.push("💀 Your empire has fallen — every territory is lost.");
          return true;
        }
        return false;
      };

      // Rival commanders take their turns (one attack each) unless the game ended.
      if (!checkEnd()) {
        for (const rival of rivals) {
          if (countFor(rival.id) === 0) continue;
          const targets = board.filter(
            (t) => t.owner !== rival.id && (ADJACENCY[t.id] ?? []).some((n) => board.find((x) => x.id === n)?.owner === rival.id),
          );
          if (targets.length === 0) continue;
          const mine = targets.filter((t) => t.owner === PLAYER_ID);
          const pool = mine.length > 0 && Math.random() < 0.55 ? mine : targets;
          const t = pool[Math.floor(Math.random() * pool.length)]!;
          const prevOwner = t.owner;
          if (Math.random() < RIVAL_WIN_CHANCE) {
            t.owner = rival.id;
            t.hero = rival.heroIds[Math.floor(Math.random() * rival.heroIds.length)]!;
            events.push(`⚔️ ${rival.name} conquered ${TERRITORY_NAME[t.id]} from ${ownerName(prevOwner) === "You" ? "you" : ownerName(prevOwner)}.`);
            if (countFor(prevOwner) === 0 && prevOwner !== PLAYER_ID) {
              events.push(`💀 ${ownerName(prevOwner)} has been eliminated from the match.`);
            }
          } else {
            events.push(`🛡️ ${rival.name} attacked ${TERRITORY_NAME[t.id]} (${ownerName(prevOwner)}) but was repelled.`);
          }
          if (checkEnd()) break;
        }
      }

      const newLog = [...events, ...oldLog].slice(0, 40);
      const updated = await db
        .update(schema.campaigns)
        .set({ board: JSON.stringify(board), log: JSON.stringify(newLog), status, round: row.round + 1 })
        .where(eq(schema.campaigns.id, args.campaignId))
        .returning();
      if (xpEarned > 0) {
        const stateRows = await db.select().from(schema.userState).limit(1);
        const cur = stateRows[0]?.xp ?? 0;
        await db.update(schema.userState).set({ xp: cur + xpEarned }).where(eq(schema.userState.id, 1));
      }
      ctx.invalidateQueries();
      return { campaign: campaignOut(updated[0]!), outcome, events, xpEarned };
    },
  }),

  markInvited: defineAction({
    description: "Marks a campaign's invite as sent to friends.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.update(schema.campaigns).set({ invitedAt: new Date() }).where(eq(schema.campaigns.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  deleteCampaign: defineAction({
    description: "Deletes one multiplayer campaign.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.campaigns).where(eq(schema.campaigns.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  resetProgress: defineAction({
    description: "Resets prototype progress: XP, streak, completions, battle party, campaigns, and membership back to free.",
    request: z.object({}),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.completions);
      await db.delete(schema.partyMembers);
      await db.delete(schema.campaigns);
      await db.update(schema.userState).set({ xp: 0, streak: 0, lastStudyDate: null, membership: "free", plan: null }).where(eq(schema.userState.id, 1));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),
} satisfies ActionsModule;
