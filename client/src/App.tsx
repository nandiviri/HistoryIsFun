import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "./api";
import { ERAS, PATHS, STORIES, type Story } from "./catalog";
import { ADJACENCY, CONTINENTS, TERRITORY_NAME } from "./board";
import { NARRATION } from "./narration";
import heroImg from "./assets/hero.webp";

type State = ApiResponse<typeof api, "getState">;
type GenStory = State["generated"][number];
type Campaign = State["campaigns"][number];
type Tab = "home" | "library" | "collection" | "arena" | "ai" | "pro";
type View =
  | { kind: "tabs" }
  | { kind: "reader"; story: Story }
  | { kind: "quiz"; story: Story }
  | { kind: "genReader"; gen: GenStory }
  | { kind: "genQuiz"; gen: GenStory };

function genToStory(g: GenStory): Story {
  return {
    id: `gen-${g.id}`,
    title: g.title,
    figure: g.figure,
    era: g.era,
    years: "AI-generated story",
    summary: g.summary,
    minutes: g.minutes,
    tier: "free",
    color: "#9A6B2F",
    initials: g.figure.split(" ").map((w) => w[0]).slice(0, 2).join(""),
    trait: "Generated for you",
    chapters: g.chapters,
    quiz: g.quiz,
  };
}

/** Resolves a completed story id (catalog or `gen-<id>`) to its hero avatar info. */
function heroFor(state: State, storyId: string): { figure: string; trait: string; image?: string; color: string; initials: string } | null {
  const s = STORIES.find((x) => x.id === storyId);
  if (s) return { figure: s.figure, trait: s.trait, image: s.image, color: s.color, initials: s.initials };
  const g = state.generated.find((x) => `gen-${x.id}` === storyId);
  if (g) {
    const st = genToStory(g);
    return { figure: st.figure, trait: st.trait, color: st.color, initials: st.initials };
  }
  return null;
}

function usePartyToggle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { storyId: string; member: string; inParty: boolean; trail?: string | null }) => api.toggleParty(args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
  });
}

function todayKey(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(now);
}

function levelFor(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  return { level, into: xp % 100 };
}

const LEVEL_NAMES = ["Novice", "Apprentice", "Storyteller", "Scholar", "Historian", "Sage", "Chronicler", "Laureate"];

export function App() {
  const queryClient = useQueryClient();
  const stateQ = useQuery({ queryKey: ["state"], queryFn: () => api.getState({}) });
  const [tab, setTab] = useState<Tab>("home");
  const [view, setView] = useState<View>({ kind: "tabs" });

  const state = stateQ.data;
  const isPro = state?.membership === "pro";
  const completedIds = useMemo(() => new Set((state?.completions ?? []).map((c) => c.storyId)), [state]);
  const partyIds = useMemo(() => new Set((state?.party ?? []).map((p) => p.storyId)), [state]);
  const partyMut = usePartyToggle();

  const membershipMut = useMutation({
    mutationFn: (args: { membership: "free" | "pro"; plan?: string | null }) => api.setMembership(args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
  });

  function openStory(story: Story) {
    if (story.tier === "pro" && !isPro) {
      setTab("pro");
      setView({ kind: "tabs" });
      return;
    }
    setView({ kind: "reader", story });
  }
  function openGen(gen: GenStory) {
    setView({ kind: "genReader", gen });
  }

  if (stateQ.isPending) {
    return <div className="min-h-screen bg-[var(--bg)] px-4 py-16 text-center"><p className="font-arcade text-sm font-bold tracking-widest text-[var(--dim)]">LOADING GAME…</p><p className="mt-2 text-4xl" aria-hidden>⚔️</p></div>;
  }
  if (stateQ.error || !state) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4 py-16 text-center">
        <p className="text-4xl" aria-hidden>💀</p>
        <p className="mt-2 font-display text-xl font-bold text-[var(--text)]">Game couldn't load</p>
        <p className="text-sm text-[var(--dim)]">Check your connection and try again.</p>
        <button type="button" onClick={() => stateQ.refetch()} className="game-btn mt-4 rounded-xl bg-[var(--accent-solid)] px-6 py-2.5 font-display font-bold text-white" aria-label="Retry loading">↻ RETRY</button>
      </div>
    );
  }

  const inReader = view.kind !== "tabs";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {view.kind === "reader" && (
        <Reader
          story={view.story}
          done={completedIds.has(view.story.id)}
          onBack={() => setView({ kind: "tabs" })}
          onQuiz={() => setView({ kind: "quiz", story: view.story })}
        />
      )}
      {view.kind === "genReader" && (
        <Reader
          story={genToStory(view.gen)}
          done={completedIds.has(`gen-${view.gen.id}`)}
          aiGenerated
          onBack={() => setView({ kind: "tabs" })}
          onQuiz={() => setView({ kind: "genQuiz", gen: view.gen })}
        />
      )}
      {(view.kind === "quiz" || view.kind === "genQuiz") && (
        <Quiz
          story={view.kind === "quiz" ? view.story : genToStory(view.gen)}
          inParty={partyIds.has(view.kind === "quiz" ? view.story.id : `gen-${view.gen.id}`)}
          onToggleParty={(join) => {
            const s = view.kind === "quiz" ? view.story : genToStory(view.gen);
            partyMut.mutate({ storyId: s.id, member: s.figure, inParty: join, trail: join ? `Cleared “${s.title}”` : null });
          }}
          onDone={() => setView({ kind: "tabs" })}
          onBack={() => setView(view.kind === "quiz" ? { kind: "reader", story: view.story } : { kind: "genReader", gen: view.gen })}
        />
      )}

      {!inReader && (
        <>
          <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-safe">
            {tab === "home" && (
              <HomeTab state={state} completedIds={completedIds} onOpen={openStory} onOpenGen={openGen} goTab={setTab} />
            )}
            {tab === "library" && <LibraryTab completedIds={completedIds} isPro={!!isPro} onOpen={openStory} />}
            {tab === "collection" && <CollectionTab completedIds={completedIds} partyIds={partyIds} onOpen={openStory} goTab={setTab} />}
            {tab === "arena" && <ArenaTab state={state} completedIds={completedIds} onOpen={openStory} goTab={setTab} />}
            {tab === "ai" && <AiTab state={state} onOpenGen={openGen} />}
            {tab === "pro" && (
              <ProTab
                state={state}
                busy={membershipMut.isPending}
                onUpgrade={(plan) => membershipMut.mutate({ membership: "pro", plan })}
                onDowngrade={() => membershipMut.mutate({ membership: "free", plan: null })}
              />
            )}
          </main>

          <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-[var(--border)] bg-[var(--surface)]/95 pb-safe backdrop-blur">
            <div className="mx-auto grid max-w-3xl grid-cols-6 px-1 pt-1.5">
              {(
                [
                  ["home", "🏠", "Base"],
                  ["library", "⚔️", "Quests"],
                  ["collection", "🏆", "Heroes"],
                  ["arena", "🛡️", "Arena"],
                  ["ai", "🤖", "AI Lab"],
                  ["pro", "👑", isPro ? "PRO ✓" : "Pass"],
                ] as [Tab, string, string][]
              ).map(([t, icon, label]) => (
                <button
                  key={t}
                  type="button"
                  aria-label={label}
                  aria-current={tab === t ? "page" : undefined}
                  onClick={() => setTab(t)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wide ${tab === t ? "bg-[var(--accent-solid)] text-white" : "text-[var(--dim)]"}`}
                >
                  <span className="text-xl leading-none" aria-hidden>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

/* ------------------------------- Home ------------------------------- */

function HomeTab({ state, completedIds, onOpen, onOpenGen, goTab }: {
  state: State;
  completedIds: Set<string>;
  onOpen: (s: Story) => void;
  onOpenGen: (g: GenStory) => void;
  goTab: (t: Tab) => void;
}) {
  const { level, into } = levelFor(state.xp);
  const levelName = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] ?? "Novice";
  const featured = STORIES.find((s) => !completedIds.has(s.id)) ?? STORIES[0]!;
  const doneCount = STORIES.filter((s) => completedIds.has(s.id)).length;

  return (
    <div>
      {/* ===== PLAYER HUD ===== */}
      <div className="game-card mt-4 rounded-2xl bg-[var(--surface)] p-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0" aria-hidden>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[var(--gold)] bg-[var(--surface2)] text-2xl">🧙</div>
            <span className="font-arcade absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-[var(--gold)] px-1.5 py-px text-[10px] font-black text-black">LV {level}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display truncate text-xl font-bold uppercase leading-none">Chronicle <span className="text-[var(--accent-text)]">· {levelName}</span></p>
              <span className={`shrink-0 rounded-md px-2 py-0.5 font-arcade text-[10px] font-black ${state.membership === "pro" ? "bg-[var(--gold)] text-black" : "bg-[var(--surface2)] text-[var(--dim)]"}`}>{state.membership === "pro" ? "👑 PRO" : "FREE"}</span>
            </div>
            <div className="mt-2.5 h-4 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface2)]" role="progressbar" aria-valuenow={into} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level">
              <div className="xp-fill h-full" style={{ width: `${Math.max(into, 4)}%` }} />
            </div>
            <p className="mt-1 text-[11px] font-bold text-[var(--dim)]"><span className="font-arcade text-[var(--accent-text)]">{state.xp} XP</span> · {100 - into} XP to Level {level + 1}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[var(--surface2)] px-2 py-2"><p className="text-base leading-none" aria-hidden>🔥</p><p className="font-arcade mt-1 text-sm font-bold" aria-label={`${state.streak} day streak`}>{state.streak}</p><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--dim)]">Day streak</p></div>
          <div className="rounded-xl bg-[var(--surface2)] px-2 py-2"><p className="text-base leading-none" aria-hidden>⚔️</p><p className="font-arcade mt-1 text-sm font-bold">{doneCount}/{STORIES.length}</p><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--dim)]">Quests cleared</p></div>
          <div className="rounded-xl bg-[var(--surface2)] px-2 py-2"><p className="text-base leading-none" aria-hidden>🏆</p><p className="font-arcade mt-1 text-sm font-bold">{STORIES.filter((s) => completedIds.has(s.id)).length}</p><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--dim)]">Heroes won</p></div>
        </div>
      </div>

      {state.party.length > 0 && (
        <button type="button" onClick={() => goTab("arena")} aria-label="Open the multiplayer Arena with your battle party"
          className="game-card mt-4 flex w-full items-center gap-3 rounded-2xl bg-[var(--surface)] p-3 text-left">
          <span className="flex shrink-0 -space-x-2" aria-hidden>
            {state.party.slice(0, 4).map((p) => {
              const h = heroFor(state, p.storyId);
              return h?.image ? (
                <img key={p.storyId} src={h.image} alt="" className="h-10 w-10 rounded-full border-2 border-[var(--surface)] object-cover" />
              ) : (
                <span key={p.storyId} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--surface)] font-display text-xs font-black text-white" style={{ backgroundColor: h?.color ?? "#64748b" }}>{h?.initials ?? "?"}</span>
              );
            })}
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-display block text-base font-bold uppercase leading-tight">🛡️ Battle party ready · {state.party.length} hero{state.party.length === 1 ? "" : "es"}</span>
            <span className="block truncate text-xs text-[var(--dim)]">{state.party.map((p) => p.member).join(" · ")} — your commanders for world domination</span>
          </span>
          <span className="font-display shrink-0 text-lg font-bold text-[var(--accent-text)]" aria-hidden>→</span>
        </button>
      )}

      <div className="relative mt-4 overflow-hidden rounded-2xl border-2 border-[var(--border)]">
        <img src={heroImg} alt="Illustrated figures from across history — an Egyptian queen, a Roman, a knight, a Renaissance master, and a modern scientist" className="h-36 w-full object-cover sm:h-44" />
        <span className="font-arcade absolute left-3 top-3 rounded-md bg-black/75 px-2 py-1 text-[10px] font-black text-[var(--gold)]">⭐ DAILY QUEST</span>
        <span className="absolute bottom-3 left-3 rounded-md bg-black/75 px-2 py-1 text-xs font-bold text-white">Finish a story + quiz · earn up to <span className="text-[var(--gold)]">+50 XP</span></span>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <span className="text-xl" aria-hidden>🎯</span>
        <h2 className="font-display text-2xl font-bold uppercase">{completedIds.has(featured.id) ? "Today's quest" : "Main quest — continue"}</h2>
      </div>
      <StoryCard story={featured} done={completedIds.has(featured.id)} locked={featured.tier === "pro" && state.membership !== "pro"} big onOpen={onOpen} />

      <div className="mt-7 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-bold uppercase">🗺️ Quest paths</h2>
        <button type="button" onClick={() => goTab("library")} className="font-display text-sm font-bold uppercase text-[var(--accent-text)]" aria-label="Browse all stories">Quest board →</button>
      </div>
      <div className="mt-3 space-y-3">
        {PATHS.map((p) => {
          const total = p.storyIds.length;
          const done = p.storyIds.filter((id) => completedIds.has(id)).length;
          const cleared = done === total;
          return (
            <div key={p.id} className="game-card rounded-2xl bg-[var(--surface)] p-4">
              <div className="flex items-baseline justify-between">
                <p className="font-display text-lg font-bold uppercase">{cleared ? "🏆 " : ""}{p.name}</p>
                <p className="font-arcade text-xs font-bold text-[var(--dim)]">{done}/{total} {cleared ? "CLEARED" : ""}</p>
              </div>
              <p className="mt-0.5 text-sm text-[var(--dim)]">{p.note}</p>
              <div className="mt-3 flex items-center" aria-hidden>
                {p.storyIds.map((id, i) => (
                  <div key={id} className="flex items-center last:flex-none" style={{ flex: i < p.storyIds.length - 1 ? 1 : undefined }}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black ${completedIds.has(id) ? "border-[var(--sage-solid)] bg-[var(--sage-solid)] text-white" : "border-[var(--border)] bg-[var(--surface2)] text-[var(--dim)]"}`}>{completedIds.has(id) ? "✓" : i + 1}</span>
                    {i < p.storyIds.length - 1 && <span className={`h-1 flex-1 ${completedIds.has(id) ? "bg-[var(--sage-solid)]" : "bg-[var(--surface2)]"}`} />}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.storyIds.map((id) => {
                  const s = STORIES.find((x) => x.id === id)!;
                  return (
                    <button key={id} type="button" onClick={() => onOpen(s)} aria-label={`Open ${s.figure} story`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${completedIds.has(id) ? "bg-[var(--sage-solid)] text-white" : "bg-[var(--surface2)] text-[var(--text)]"}`}>
                      {completedIds.has(id) ? "✓ " : "▶ "}{s.figure}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {state.generated.length > 0 && (
        <>
          <h2 className="mt-7 font-display text-2xl font-bold uppercase">🤖 Your custom quests</h2>
          <div className="mt-3 space-y-3">
            {state.generated.slice(0, 3).map((g) => (
              <button key={g.id} type="button" onClick={() => onOpenGen(g)} aria-label={`Open AI story ${g.title}`}
                className="game-card block w-full rounded-2xl bg-[var(--surface)] p-4 text-left">
                <p className="font-arcade text-[10px] font-black uppercase tracking-wider text-[var(--cyan)]">AI-GENERATED · {g.era}</p>
                <p className="mt-1 font-display text-lg font-bold leading-snug">{g.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-[var(--dim)]">{g.summary}</p>
              </button>
            ))}
          </div>
        </>
      )}

      <button type="button" onClick={() => goTab("ai")} aria-label="Create a story with AI"
        className="game-btn mt-6 w-full rounded-2xl bg-[var(--cyan-solid)] p-4 text-left text-white">
        <p className="font-display text-lg font-bold uppercase">🤖 Summon any story with AI</p>
        <p className="mt-0.5 text-sm text-white/85">Type any figure or event — “the fall of the Berlin Wall”, “Ada Lovelace” — and get a 5-minute quest with a boss quiz.</p>
      </button>
    </div>
  );
}

/* ------------------------------ Library ------------------------------ */

function StoryCard({ story, done, locked, big, onOpen }: { story: Story; done: boolean; locked: boolean; big?: boolean; onOpen: (s: Story) => void }) {
  const stars = story.minutes >= 6 ? "★★☆" : "★☆☆";
  return (
    <button type="button" onClick={() => onOpen(story)} aria-label={`${locked ? "Locked, Pro only: " : ""}${story.title}`}
      className={`game-card mt-3 block w-full overflow-hidden rounded-2xl bg-[var(--surface)] text-left ${story.tier === "pro" ? "!border-[var(--gold)]" : ""}`}>
      <div className="flex">
        <div className="relative shrink-0">
          {story.image ? (
            <img src={story.image} alt={`Illustrated portrait of ${story.figure}`} className={`${big ? "h-48 w-32" : "h-36 w-24"} object-cover ${locked ? "opacity-50 grayscale" : ""}`} />
          ) : (
            <div className={`${big ? "h-48 w-32 text-5xl" : "h-36 w-24 text-3xl"} flex items-center justify-center font-display font-black text-white ${locked ? "opacity-50 grayscale" : ""}`} style={{ backgroundColor: story.color }} aria-hidden>
              {story.initials}
            </div>
          )}
          {locked && <span className="absolute inset-0 flex items-center justify-center text-3xl" aria-hidden>🔒</span>}
          <span className="font-arcade absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-black text-[var(--gold)]">{story.tier === "pro" ? "LEGENDARY" : "RARE"}</span>
        </div>
        <div className="min-w-0 flex-1 p-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-arcade text-[10px] font-black uppercase tracking-wider text-[var(--cyan)]">{story.era}</span>
            <span className="text-[11px] text-[var(--gold)]" aria-label={`Difficulty ${story.minutes >= 6 ? 2 : 1} of 3`}>{stars}</span>
            {done && <span className="rounded bg-[var(--sage-solid)] px-1.5 py-0.5 text-[10px] font-black text-white">✓ CLEARED</span>}
          </div>
          <p className={`mt-1 font-display font-bold leading-snug ${big ? "text-xl" : "text-base"}`}>{story.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--dim)]">{story.summary}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-[var(--surface2)] px-2 py-1 text-[11px] font-bold">⏱ {story.minutes} min</span>
            <span className="rounded-md bg-[var(--gold)] px-2 py-1 font-arcade text-[11px] font-black text-black">UP TO +50 XP</span>
            <span className="rounded-md bg-[var(--surface2)] px-2 py-1 text-[11px] font-bold">{locked ? "👑 Unlock with Pro" : done ? "↻ Replay +5 XP" : "▶ Play quest"}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function LibraryTab({ completedIds, isPro, onOpen }: { completedIds: Set<string>; isPro: boolean; onOpen: (s: Story) => void }) {
  const [era, setEra] = useState<string>("All");
  const [q, setQ] = useState("");
  const list = STORIES.filter((s) => (era === "All" || s.era === era) && (q === "" || `${s.title} ${s.figure}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="pt-5">
      <p className="font-arcade text-[10px] font-black tracking-widest text-[var(--cyan)]">SELECT YOUR NEXT MISSION</p>
      <h1 className="font-display mt-1 text-4xl font-bold uppercase leading-none">⚔️ Quest board</h1>
      <p className="mt-1.5 text-sm text-[var(--dim)]">{STORIES.filter((s) => s.tier === "free").length} quests free · {STORIES.filter((s) => s.tier === "pro").length} legendary quests with Pro · each clear pays up to <span className="font-bold text-[var(--accent-text)]">+50 XP</span></p>
      <label className="sr-only" htmlFor="story-search">Search stories</label>
      <input id="story-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎 Search a hero or quest…"
        className="mt-4 w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base outline-none focus:border-[var(--accent-solid)]" />
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by era">
        {ERAS.map((e) => (
          <button key={e} type="button" onClick={() => setEra(e)} aria-pressed={era === e}
            className={`rounded-lg px-3.5 py-1.5 font-display text-sm font-bold uppercase ${era === e ? "bg-[var(--accent-solid)] text-white" : "bg-[var(--surface)] text-[var(--dim)] border-2 border-[var(--border)]"}`}>{e}</button>
        ))}
      </div>
      {list.length === 0 && <p className="mt-8 text-center text-[var(--dim)]">No quests match — summon one in the AI Lab 🤖</p>}
      {list.map((s) => (
        <StoryCard key={s.id} story={s} done={completedIds.has(s.id)} locked={s.tier === "pro" && !isPro} onOpen={onOpen} />
      ))}
    </div>
  );
}

/* ----------------------------- Collection ----------------------------- */

function CollectionTab({ completedIds, partyIds, onOpen, goTab }: { completedIds: Set<string>; partyIds: Set<string>; onOpen: (s: Story) => void; goTab: (t: Tab) => void }) {
  const gotCount = STORIES.filter((s) => completedIds.has(s.id)).length;
  const partyMut = usePartyToggle();
  return (
    <div className="pt-5">
      <p className="font-arcade text-[10px] font-black tracking-widest text-[var(--cyan)]">HERO ROSTER</p>
      <h1 className="font-display mt-1 text-4xl font-bold uppercase leading-none">🏆 Your heroes</h1>
      <p className="mt-1.5 text-sm text-[var(--dim)]">Clear a quest and beat its boss quiz to unlock the hero's avatar — then add them to your battle party to fight for world domination in the Arena.</p>
      <div className="game-card mt-4 rounded-2xl bg-[var(--surface)] p-3.5">
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-bold uppercase">Unlocked</p>
          <p className="font-arcade text-sm font-black text-[var(--accent-text)]">{gotCount} / {STORIES.length}</p>
        </div>
        <div className="mt-2 h-3.5 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface2)]" role="progressbar" aria-valuenow={gotCount} aria-valuemin={0} aria-valuemax={STORIES.length} aria-label="Heroes unlocked">
          <div className="h-full bg-[var(--sage-solid)]" style={{ width: `${(gotCount / STORIES.length) * 100}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-[var(--dim)]">{gotCount === 0 ? "No heroes yet — your first unlock is one quest away." : gotCount === STORIES.length ? "Full roster! Every hero collected. 🎉" : `${STORIES.length - gotCount} heroes still locked. Keep questing.`}</p>
      </div>
      <div className="game-card mt-3 flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-3.5">
        <span className="text-2xl" aria-hidden>🛡️</span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold uppercase leading-tight">Battle party · {partyIds.size} hero{partyIds.size === 1 ? "" : "es"}</p>
          <p className="text-xs text-[var(--dim)]">Your party heroes hold your territories in multiplayer conquest — rivals must answer questions about them to take your land.</p>
        </div>
        <button type="button" onClick={() => goTab("arena")} aria-label="Open the Arena"
          className="game-btn shrink-0 rounded-xl bg-[var(--accent-solid)] px-3.5 py-2 font-display text-sm font-bold uppercase text-white">Arena →</button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STORIES.map((s) => {
          const got = completedIds.has(s.id);
          const legendary = s.tier === "pro";
          const inParty = partyIds.has(s.id);
          return (
            <div key={s.id} className="flex flex-col">
              <button type="button" onClick={() => onOpen(s)} aria-label={got ? `Collected: ${s.figure}` : `Locked card: ${s.figure}. Read the story to collect.`}
                className={`game-card block w-full flex-1 overflow-hidden rounded-2xl bg-[var(--surface)] text-left ${got && legendary ? "!border-[var(--gold)]" : ""}`}>
                <div className="relative">
                  {s.image ? (
                    <img src={s.image} alt={got ? `Illustrated portrait of ${s.figure}` : ""} className={`h-36 w-full object-cover ${got ? "" : "opacity-25 grayscale"}`} />
                  ) : (
                    <div className={`flex h-36 items-center justify-center font-display text-4xl font-black text-white ${got ? "" : "opacity-25 grayscale"}`} style={{ backgroundColor: s.color }} aria-hidden>{s.initials}</div>
                  )}
                  {!got && <span className="absolute inset-0 flex items-center justify-center text-3xl" aria-hidden>🔒</span>}
                  <span className={`font-arcade absolute left-2 top-2 rounded px-1.5 py-0.5 text-[9px] font-black ${legendary ? "bg-[var(--gold)] text-black" : "bg-black/70 text-white"}`}>{legendary ? "★ LEGENDARY" : "RARE"}</span>
                  {got && <span className="absolute bottom-2 right-2 rounded bg-[var(--sage-solid)] px-1.5 py-0.5 text-[10px] font-black text-white">IN ROSTER ✓</span>}
                </div>
                <div className="p-3">
                  <p className="font-display text-base font-bold uppercase leading-tight">{got ? s.figure : "??? Locked hero"}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--dim)]">{got ? `⚡ ${s.trait}` : `${s.era} · clear the quest to unlock`}</p>
                </div>
              </button>
              {got && (
                <button type="button" disabled={partyMut.isPending}
                  onClick={() => partyMut.mutate({ storyId: s.id, member: s.figure, inParty: !inParty, trail: inParty ? null : `Cleared “${s.title}”` })}
                  aria-label={inParty ? `Remove ${s.figure} from your battle party` : `Add ${s.figure} to your battle party`}
                  className={`mt-2 w-full rounded-xl py-2 text-xs font-black uppercase disabled:opacity-50 ${inParty ? "bg-[var(--sage-solid)] text-white" : "border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"}`}>
                  {inParty ? "🛡️ In battle party ✓" : "⚔️ Add to battle party"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- Reader ------------------------------- */

function Reader({ story, done, aiGenerated, onBack, onQuiz }: {
  story: Story;
  done: boolean;
  aiGenerated?: boolean;
  onBack: () => void;
  onQuiz: () => void;
}) {
  const [page, setPage] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingRef = useRef(false);
  // True only after the reader has actually started device speech (AI
  // stories, via the Listen button). The speechSynthesis API is never
  // touched before that: in the phone WebView this app runs in, calling
  // getVoices()/cancel() on mount can stall the renderer and freeze the
  // app the moment a story opens — that was the "opening stories freezes
  // the app" regression from the narration fix. Built-in stories use
  // recorded audio and never touch device speech at all.
  const speechUsedRef = useRef(false);
  const total = story.chapters.length;
  const chapter = story.chapters[page]!;
  const isLast = page === total - 1;
  // Built-in library stories ship with a recorded narration MP3 per chapter
  // (see narration.ts) — device speechSynthesis is unreliable inside embedded
  // webviews, which is why the old Listen button often produced no sound.
  // AI-generated stories have no recording, so they use device speech for
  // their actual runtime text.
  const audioSrc = NARRATION[story.id]?.[page];

  function stopAudio() {
    const a = audioRef.current;
    if (a) {
      a.pause();
    }
  }
  function stopSpeak() {
    // Only cancel if device speech was actually started in this reader —
    // touching speechSynthesis when it was never used can stall the
    // WebView renderer (see speechUsedRef note above).
    if (speechUsedRef.current && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* device speech unavailable — nothing to stop */
      }
    }
    speakingRef.current = false;
    setSpeaking(false);
  }
  function stopNarration() {
    stopAudio();
    stopSpeak();
  }
  useEffect(() => () => {
    stopSpeak();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);
  // Chrome/Android device speech stalls mid-utterance on long text unless
  // it is periodically resumed while speaking.
  useEffect(() => {
    if (!speaking) return;
    const t = window.setInterval(() => {
      const synth = window.speechSynthesis;
      if (synth && synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 10000);
    return () => window.clearInterval(t);
  }, [speaking]);
  useEffect(() => {
    stopNarration();
    setSpeechError(null);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [page]);

  function changePage(next: number) {
    stopNarration();
    setPage(next);
  }

  function toggleSpeak() {
    if (!("speechSynthesis" in window)) {
      setSpeechError("This device doesn't offer voice narration for AI-generated stories. You can still read the chapter below.");
      return;
    }
    if (speaking) { stopSpeak(); return; }
    setSpeechError(null);
    // All speechSynthesis contact for AI stories happens here, inside the
    // tap handler — never on mount (see speechUsedRef note above).
    speechUsedRef.current = true;
    speakingRef.current = true;
    setSpeaking(true);
    try {
      const synth = window.speechSynthesis;
      let spoke = false;
      const speak = () => {
        if (spoke || !speakingRef.current) return;
        spoke = true;
        const u = new SpeechSynthesisUtterance(`${chapter.heading}. ${chapter.text}`);
        u.rate = 0.98;
        u.lang = "en-US";
        const voices = synth.getVoices();
        const voice = voices.find((v) => v.lang.toLowerCase().startsWith("en") && v.default) ?? voices.find((v) => v.lang.toLowerCase().startsWith("en"));
        if (voice) u.voice = voice;
        u.onend = () => { speakingRef.current = false; setSpeaking(false); };
        u.onerror = (e) => {
          speakingRef.current = false;
          setSpeaking(false);
          if (e.error !== "canceled" && e.error !== "interrupted") {
            setSpeechError("Your device couldn't play the narration out loud. Check the volume isn't muted, then try again.");
          }
        };
        synth.cancel();
        synth.speak(u);
        // Some webviews queue the utterance but never start it; if nothing
        // is speaking shortly after, tell the user instead of failing
        // silently.
        window.setTimeout(() => {
          if (speakingRef.current && !synth.speaking && !synth.pending) {
            speakingRef.current = false;
            setSpeaking(false);
            setSpeechError("Narration didn't start on this device. You can still read the chapter below.");
          }
        }, 1500);
      };
      // On many phones getVoices() is empty until the voiceschanged event
      // fires, and speaking before that is silent — wait for the list once,
      // with a short fallback so the tap never hangs waiting.
      if (synth.getVoices().length > 0) {
        speak();
      } else {
        const onVoices = () => {
          synth.removeEventListener("voiceschanged", onVoices);
          speak();
        };
        synth.addEventListener("voiceschanged", onVoices);
        window.setTimeout(() => {
          synth.removeEventListener("voiceschanged", onVoices);
          speak();
        }, 700);
      }
    } catch {
      speakingRef.current = false;
      setSpeaking(false);
      setSpeechError("Your device couldn't play the narration out loud. You can still read the chapter below.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-safe">
      <div className="flex items-center justify-between pt-4">
        <button type="button" onClick={() => { stopNarration(); onBack(); }} aria-label="Back to stories" className="game-btn rounded-xl bg-[var(--surface)] px-4 py-2 font-display text-sm font-bold uppercase">← Quit quest</button>
        <span className="font-arcade text-[10px] font-black uppercase tracking-wider text-[var(--dim)]">{story.era} · {story.minutes} min</span>
      </div>

      <div className="mt-3 flex gap-1.5" role="progressbar" aria-valuenow={page + 1} aria-valuemin={1} aria-valuemax={total} aria-label="Story progress">
        {story.chapters.map((_c, i) => (
          <span key={i} className={`h-3 flex-1 rounded-sm border border-[var(--border)] ${i <= page ? "xp-fill" : "bg-[var(--surface2)]"}`} />
        ))}
      </div>
      <p className="font-arcade mt-1.5 text-[10px] font-bold text-[var(--dim)]">QUEST PROGRESS · STAGE {page + 1}/{total}</p>

      {page === 0 && (
        <div className="mt-4">
          {story.image && <img src={story.image} alt={`Illustrated portrait of ${story.figure}`} className="h-56 w-full rounded-2xl border-2 border-[var(--border)] object-cover" />}
          <p className="font-arcade mt-4 text-[10px] font-black tracking-widest text-[var(--cyan)]">⚔️ QUEST BRIEFING</p>
          <h1 className="font-display mt-1 text-3xl font-bold uppercase leading-tight">{story.title}</h1>
          <p className="mt-1 text-sm font-bold text-[var(--dim)]">{story.figure} · {story.years} · Reward: <span className="text-[var(--accent-text)]">up to +50 XP + hero card</span></p>
          <p className="mt-2 text-base text-[var(--dim)]">{story.summary}</p>
          {aiGenerated && <p className="mt-2 inline-block rounded-lg bg-[var(--surface2)] px-3 py-1 text-xs font-bold text-[var(--accent-text)]">🤖 AI-generated prototype story — enjoy, and double-check details you plan to quote</p>}
          {done && <p className="mt-2 inline-block rounded-lg bg-[var(--sage-solid)] px-3 py-1 text-xs font-black text-white">✓ QUEST CLEARED — replay earns +5 XP</p>}
        </div>
      )}

      <article className="game-card mt-5 rounded-2xl bg-[var(--surface)] p-5 sm:p-7">
        <p className="font-arcade text-[10px] font-black uppercase tracking-widest text-[var(--accent-text)]">⚡ Stage {page + 1} of {total}</p>
        <h2 className="font-display mt-1 text-2xl font-bold uppercase">{chapter.heading}</h2>
        <p className="mt-3 text-[17px] leading-8">{chapter.text}</p>
        {audioSrc ? (
          <>
            <audio
              key={audioSrc}
              ref={audioRef}
              src={audioSrc}
              controls
              preload="metadata"
              aria-label={`Listen to chapter ${page + 1}: ${chapter.heading}`}
              className="mt-5 w-full"
              onError={() => setSpeechError("This chapter's narration recording couldn't be loaded. Check your connection, then try again.")}
            />
            <p className="mt-2 text-center text-xs text-[var(--dim)]">Press play to hear this chapter read aloud — drag the slider to rewind or skip ahead.</p>
          </>
        ) : (
          <>
            <button type="button" onClick={toggleSpeak} aria-label={speaking ? "Stop narration" : "Listen to this chapter"}
              className="game-btn mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--text)] py-3 font-display font-bold uppercase text-[var(--bg)]">
              {speaking ? "⏸ Stop narration" : "▶ Listen to this chapter"}
            </button>
            <p className="mt-2 text-center text-xs text-[var(--dim)]">This AI-generated story is narrated with your device's voice.</p>
          </>
        )}
        {speechError && <p role="alert" className="mt-2 text-center text-sm font-medium text-[var(--oxblood)]">{speechError}</p>}
      </article>

      <div className="mt-4 flex gap-3">
        <button type="button" disabled={page === 0} onClick={() => changePage(page - 1)} aria-label="Previous chapter"
          className="game-btn flex-1 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] py-3 font-display font-bold uppercase disabled:opacity-40">← Back</button>
        {!isLast ? (
          <button type="button" onClick={() => changePage(page + 1)} aria-label="Next chapter"
            className="game-btn flex-1 rounded-xl bg-[var(--accent-solid)] py-3 font-display font-bold uppercase text-white">Next stage →</button>
        ) : (
          <button type="button" onClick={() => { stopNarration(); onQuiz(); }} aria-label="Take the quiz"
            className="game-btn flex-1 rounded-xl bg-[#dc2626] py-3 font-display font-bold uppercase text-white">⚔️ Boss quiz</button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Quiz -------------------------------- */

function Quiz({ story, inParty, onToggleParty, onDone, onBack }: { story: Story; inParty: boolean; onToggleParty: (join: boolean) => void; onDone: () => void; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [award, setAward] = useState<{ xpEarned: number; totalXp: number; streak: number } | null>(null);
  const savedRef = useRef(false);

  const completeMut = useMutation({
    mutationFn: (finalScore: number) =>
      api.completeStory({ storyId: story.id, quizScore: finalScore, quizTotal: story.quiz.length, today: todayKey() }),
    onSuccess: (r) => {
      setAward(r);
      queryClient.invalidateQueries({ queryKey: ["state"] });
    },
  });

  const q = story.quiz[idx]!;
  const isLast = idx === story.quiz.length - 1;

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answerIndex) setScore((s) => s + 1);
  }
  function next() {
    if (!isLast) {
      setIdx((i) => i + 1);
      setPicked(null);
    } else {
      setFinished(true);
      if (!savedRef.current) {
        savedRef.current = true;
        completeMut.mutate(score);
      }
    }
  }

  if (finished) {
    const perfect = score === story.quiz.length;
    const stars = score === 3 ? "★★★" : score === 2 ? "★★☆" : score === 1 ? "★☆☆" : "☆☆☆";
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-safe">
        <div className="pt-8 text-center">
          <p className="font-arcade text-[10px] font-black tracking-widest text-[var(--cyan)]">{perfect ? "FLAWLESS VICTORY" : "QUEST COMPLETE"}</p>
          <p className="mt-2 text-6xl" aria-hidden>{perfect ? "🏆" : "🎉"}</p>
          <p className="mt-2 text-3xl tracking-[0.3em] text-[var(--gold)]" aria-label={`${score} of 3 stars`}>{stars}</p>
          <h1 className="font-display mt-2 text-4xl font-bold uppercase">{perfect ? "Boss defeated!" : "Victory!"}</h1>
          <p className="mt-2 text-[var(--dim)]">You answered {score} of {story.quiz.length} questions correctly.</p>
          {award ? (
            <div className="game-card mx-auto mt-5 max-w-sm rounded-2xl bg-[var(--surface)] p-5">
              <p className="font-arcade text-[10px] font-black tracking-widest text-[var(--dim)]">🎁 LOOT EARNED</p>
              <p className="font-arcade mt-1 text-3xl font-black text-[var(--accent-text)]">+{award.xpEarned} XP</p>
              <p className="mt-1 text-sm font-semibold text-[var(--dim)]">Total {award.totalXp} XP · 🔥 {award.streak}-day streak</p>
              <p className="mt-3 rounded-xl bg-[var(--gold)] px-3 py-2.5 font-display text-base font-bold uppercase text-black">🏆 New hero unlocked: {story.figure}</p>
            </div>
          ) : (
            <p className="mt-5 text-sm text-[var(--dim)]">Saving your loot…</p>
          )}
          {award && (
            inParty ? (
              <p className="mx-auto mt-4 max-w-sm rounded-xl bg-[var(--surface2)] px-3 py-2.5 text-sm font-bold">🛡️ {story.figure} is in your battle party — ready to conquer the world in the Arena.</p>
            ) : (
              <button type="button" onClick={() => onToggleParty(true)} aria-label={`Add ${story.figure} to your battle party`}
                className="game-btn mx-auto mt-4 block w-full max-w-sm rounded-xl bg-[var(--cyan-solid)] py-3 font-display text-base font-bold uppercase text-white">
                ⚔️ Add {story.figure} to battle party
              </button>
            )
          )}
          <button type="button" onClick={onDone} aria-label="Back to home" className="game-btn mt-6 w-full max-w-sm rounded-xl bg-[var(--accent-solid)] py-3.5 font-display text-lg font-bold uppercase text-white">▶ Keep questing</button>
        </div>
      </div>
    );
  }

  const hpLeft = story.quiz.length - score;
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-safe">
      <div className="flex items-center justify-between pt-4">
        <button type="button" onClick={onBack} aria-label="Back to story" className="game-btn rounded-xl bg-[var(--surface)] px-4 py-2 font-display text-sm font-bold uppercase">← Retreat</button>
        <span className="font-arcade rounded-md bg-[#dc2626] px-2 py-1 text-[10px] font-black text-white">⚔️ BOSS FIGHT</span>
      </div>
      {/* Boss HP + your score */}
      <div className="game-card mt-3 rounded-2xl bg-[var(--surface)] p-3.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span>👹 Boss HP</span>
          <span className="font-arcade">{Math.max(hpLeft, 0)}/{story.quiz.length}</span>
        </div>
        <div className="mt-1.5 flex gap-1.5" aria-hidden>
          {story.quiz.map((_, i) => (
            <span key={i} className={`h-3.5 flex-1 rounded-sm border border-[var(--border)] ${i < hpLeft ? "hp-fill" : "bg-[var(--surface2)]"}`} />
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs font-bold">
          <span>⭐ Your score</span>
          <span className="font-arcade text-[var(--accent-text)]">{score * 10} XP banked · {score} hit{score === 1 ? "" : "s"}</span>
        </div>
      </div>
      <p className="font-arcade mt-4 text-[10px] font-black tracking-widest text-[var(--dim)]">ROUND {idx + 1} OF {story.quiz.length} · +10 XP PER HIT</p>
      <h1 className="font-display mt-1.5 text-2xl font-bold leading-snug">{q.question}</h1>
      <div className="mt-5 space-y-3" role="group" aria-label="Answer choices">
        {q.options.map((opt, i) => {
          const isRight = picked !== null && i === q.answerIndex;
          const isWrongPick = picked === i && i !== q.answerIndex;
          return (
            <button key={i} type="button" onClick={() => pick(i)} disabled={picked !== null} aria-label={`Answer: ${opt}`}
              className={`w-full rounded-xl border-2 p-4 text-left text-base font-semibold ${
                isRight ? "border-[var(--sage-solid)] bg-[var(--sage-solid)]/15" : isWrongPick ? "border-[#dc2626] bg-[#dc2626]/10" : "game-card bg-[var(--surface)]"
              }`}>
              <span className="font-arcade mr-2 text-xs font-black text-[var(--dim)]">{["A", "B", "C", "D"][i]}</span>
              {opt} {isRight ? " 💥 HIT! ✓" : isWrongPick ? " ✗ MISS" : ""}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={`mt-4 rounded-2xl border-2 p-4 ${picked === q.answerIndex ? "border-[var(--sage-solid)] bg-[var(--surface)]" : "border-[#dc2626] bg-[var(--surface)]"}`}>
          <p className="font-display text-lg font-bold uppercase">{picked === q.answerIndex ? "💥 Critical hit! +10 XP" : "🛡️ Boss blocks your attack"}</p>
          <p className="mt-1 text-sm">{q.explanation}</p>
          <button type="button" onClick={next} aria-label={isLast ? "See results" : "Next question"} className="game-btn mt-3 w-full rounded-xl bg-[var(--text)] py-3 font-display font-bold uppercase text-[var(--bg)]">
            {isLast ? "🏆 Claim victory" : "Next round →"}
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Arena -------------------------------- */

const PLAYER_COLOR = "#f59e0b";

/** Lobby preview of the rival commanders (mirrors the server's match setup). */
const RIVAL_PREVIEW = [
  { id: "ada", name: "Ada the Archivist", emoji: "🧠", color: "#0284c7", heroIds: ["leonardo", "curie", "tesla"] },
  { id: "marco", name: "Marco the Merciless", emoji: "⚔️", color: "#dc2626", heroIds: ["caesar", "genghis", "joan"] },
  { id: "sofia", name: "Sofia the Storm", emoji: "🌪️", color: "#7c3aed", heroIds: ["cleopatra", "tubman", "lincoln", "kahlo"] },
];

function ArenaTab({ state, completedIds, onOpen, goTab }: {
  state: State;
  completedIds: Set<string>;
  onOpen: (s: Story) => void;
  goTab: (t: Tab) => void;
}) {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<number | null>(null);
  const [matchName, setMatchName] = useState("World Domination");
  const partyMut = usePartyToggle();

  const matches = state.campaigns.filter((c) => c.board !== null);
  const legacy = state.campaigns.filter((c) => c.board === null);
  const openMatch = matches.find((c) => c.id === openId) ?? null;

  const completedHeroIds = useMemo(() => [...new Set(state.completions.map((c) => c.storyId))], [state]);
  const partyHeroIds = state.party.map((p) => p.storyId);
  const rosterIds = partyHeroIds.length > 0 ? partyHeroIds : completedHeroIds;
  const benchHeroes = completedHeroIds.filter((id) => !partyHeroIds.includes(id));

  const createMut = useMutation({
    mutationFn: (args: { name: string; heroIds: string[] }) => api.createMatch(args),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["state"] });
      setOpenId(r.campaign.id);
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteCampaign({ id }),
    onSuccess: (_r, id) => {
      queryClient.invalidateQueries({ queryKey: ["state"] });
      if (openId === id) setOpenId(null);
    },
  });

  if (openMatch) {
    return (
      <ConquestMatch
        key={openMatch.id}
        state={state}
        campaign={openMatch}
        completedIds={completedIds}
        onOpen={onOpen}
        onBack={() => setOpenId(null)}
        onDelete={() => deleteMut.mutate(openMatch.id)}
      />
    );
  }

  return (
    <div className="pt-5">
      <p className="font-arcade text-[10px] font-black tracking-widest text-[var(--cyan)]">MULTIPLAYER · WORLD DOMINATION</p>
      <h1 className="font-display mt-1 text-4xl font-bold uppercase leading-none">🌍 The Arena</h1>
      <p className="mt-1.5 text-sm text-[var(--dim)]">Every hero you learn joins your side. Conquer the world board territory by territory — to advance, you must answer questions about the hero holding the land. Rivals conquer the same way: by out-knowing <em>your</em> heroes.</p>

      <div className="game-card mt-4 rounded-2xl bg-[var(--surface)] p-4" aria-label="How multiplayer conquest works">
        <p className="font-display text-base font-bold uppercase">🎯 How conquest works</p>
        <ol className="mt-3 space-y-3">
          {[
            ["Build your party", "Finish stories to unlock hero avatars, then add them to your battle party below. Your heroes hold your territories."],
            ["Attack a bordering territory", "Tap any enemy territory next to your empire. Its garrison hero defends it — answer 3 questions about that hero; 2 or more correct and the land is yours (+15 XP)."],
            ["Survive the rivals' turns", "After your move, each rival commander attacks too — including your land. Hold all 16 territories to win the world."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="font-arcade flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-solid)] text-sm font-black text-white">{i + 1}</span>
              <p className="text-sm"><span className="font-bold">{t}.</span> <span className="text-[var(--dim)]">{d}</span></p>
            </li>
          ))}
        </ol>
        <p className="mt-3 rounded-xl bg-[var(--surface2)] px-3 py-2 text-xs font-semibold text-[var(--dim)]">Prototype note: in the full game, friends join with your invite code and defend their own heroes. Here, three rival commanders fill their seats so you can play the full conquest loop now.</p>
      </div>

      {/* ---- Battle party ---- */}
      <h2 className="font-display mt-7 text-2xl font-bold uppercase">🛡️ Your battle party</h2>
      {completedHeroIds.length === 0 ? (
        <div className="game-card mt-3 rounded-2xl bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--dim)]">No heroes unlocked yet. A hero's avatar joins you when you finish their story and boss quiz — then they can hold territory for you.</p>
          <button type="button" onClick={() => goTab("library")} aria-label="Go to the quest board" className="game-btn mt-3 rounded-xl bg-[var(--accent-solid)] px-4 py-2.5 font-display text-sm font-bold uppercase text-white">⚔️ Go unlock a hero</button>
        </div>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            {partyHeroIds.map((id) => {
              const h = heroFor(state, id);
              if (!h) return null;
              return (
                <div key={id} className="game-card flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-3">
                  {h.image ? <img src={h.image} alt={`Illustrated portrait of ${h.figure}`} className="h-11 w-11 shrink-0 rounded-xl object-cover" /> : <span className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-white" style={{ backgroundColor: h.color }} aria-hidden>{h.initials}</span>}
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-base font-bold uppercase leading-tight">{h.figure}</p>
                    <p className="truncate text-xs text-[var(--dim)]">⚡ {h.trait} · in your party</p>
                  </div>
                  <button type="button" disabled={partyMut.isPending} onClick={() => partyMut.mutate({ storyId: id, member: h.figure, inParty: false })} aria-label={`Bench ${h.figure}`} className="shrink-0 rounded-lg bg-[var(--surface2)] px-3 py-1.5 text-xs font-bold disabled:opacity-50">Bench</button>
                </div>
              );
            })}
            {partyHeroIds.length === 0 && <p className="text-sm text-[var(--dim)]">Party is empty — if you start a match now, all your unlocked heroes fight for you. Add favorites to control exactly who holds your land.</p>}
          </div>
          {benchHeroes.length > 0 && (
            <>
              <p className="font-display mt-4 text-sm font-bold uppercase text-[var(--dim)]">Unlocked, not in party</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {benchHeroes.map((id) => {
                  const h = heroFor(state, id);
                  if (!h) return null;
                  return (
                    <button key={id} type="button" disabled={partyMut.isPending}
                      onClick={() => partyMut.mutate({ storyId: id, member: h.figure, inParty: true, trail: "Joined from the Arena" })}
                      aria-label={`Add ${h.figure} to your battle party`}
                      className="rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold disabled:opacity-50">＋ {h.figure}</button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ---- Start a match ---- */}
      <h2 className="font-display mt-7 text-2xl font-bold uppercase">🚩 Start a conquest</h2>
      <div className="game-card mt-3 rounded-2xl bg-[var(--surface)] p-4">
        <label htmlFor="match-name" className="font-display text-base font-bold uppercase">Match name</label>
        <input id="match-name" value={matchName} onChange={(e) => setMatchName(e.target.value)} maxLength={60}
          className="mt-2 w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-base outline-none focus:border-[var(--accent-solid)]" />
        <p className="mt-3 text-sm"><span className="font-bold">Your commanders:</span> <span className="text-[var(--dim)]">{rosterIds.length === 0 ? "none yet — unlock a hero first" : rosterIds.map((id) => heroFor(state, id)?.figure ?? id).join(", ")}</span></p>
        <div className="mt-3 space-y-2">
          {RIVAL_PREVIEW.map((r) => (
            <div key={r.id} className="flex items-center gap-2.5 rounded-xl bg-[var(--surface2)] px-3 py-2">
              <span className="text-lg" aria-hidden>{r.emoji}</span>
              <p className="min-w-0 flex-1 truncate text-sm"><span className="font-bold" style={{ color: r.color }}>{r.name}</span> <span className="text-[var(--dim)]">· fields {r.heroIds.map((id) => STORIES.find((s) => s.id === id)?.figure ?? id).join(", ")}</span></p>
            </div>
          ))}
        </div>
        <button type="button" disabled={createMut.isPending || rosterIds.length === 0 || matchName.trim().length < 2}
          onClick={() => createMut.mutate({ name: matchName.trim(), heroIds: rosterIds })}
          aria-label="Start world domination match"
          className="game-btn mt-4 w-full rounded-xl bg-[#dc2626] py-3.5 font-display text-lg font-bold uppercase text-white disabled:opacity-50">
          {createMut.isPending ? "⏳ Dealing the world…" : "🌍 Start conquest"}
        </button>
        {createMut.isError && <p className="mt-2 text-center text-sm text-[var(--oxblood)]" role="alert">Couldn't start that match — unlock a hero first, then try again.</p>}
      </div>

      {/* ---- Existing matches ---- */}
      {matches.length > 0 && (
        <>
          <h2 className="font-display mt-7 text-2xl font-bold uppercase">🗺️ Your matches</h2>
          <div className="mt-3 space-y-3">
            {matches.map((c) => {
              const mine = c.board?.filter((t) => t.owner === "you").length ?? 0;
              return (
                <div key={c.id} className="game-card rounded-2xl bg-[var(--surface)] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display truncate text-lg font-bold uppercase">{c.name}</p>
                    <span className={`font-arcade shrink-0 rounded px-2 py-0.5 text-[10px] font-black ${c.status === "won" ? "bg-[var(--gold)] text-black" : c.status === "lost" ? "bg-[#dc2626] text-white" : "bg-[var(--sage-solid)] text-white"}`}>{c.status === "won" ? "👑 WON" : c.status === "lost" ? "💀 LOST" : `ROUND ${c.round}`}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--dim)]">You hold <span className="font-bold text-[var(--text)]">{mine}/16</span> territories · invite code <span className="font-arcade font-black text-[var(--text)]">{c.inviteCode}</span></p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setOpenId(c.id)} aria-label={`Open match ${c.name}`} className="game-btn flex-1 rounded-xl bg-[var(--accent-solid)] py-2.5 font-display text-sm font-bold uppercase text-white">{c.status === "active" ? "▶ Continue conquest" : "👀 View final board"}</button>
                    <button type="button" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(c.id)} aria-label={`Delete match ${c.name}`} className="rounded-xl bg-[var(--surface2)] px-4 py-2.5 text-sm font-bold disabled:opacity-50">🗑 Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      {legacy.map((c) => (
        <div key={c.id} className="game-card mt-3 flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-3.5">
          <p className="min-w-0 flex-1 truncate text-sm text-[var(--dim)]"><span className="font-bold text-[var(--text)]">{c.name}</span> · earlier prototype lobby (invite {c.inviteCode})</p>
          <button type="button" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(c.id)} aria-label={`Delete lobby ${c.name}`} className="shrink-0 rounded-lg bg-[var(--surface2)] px-3 py-1.5 text-xs font-bold disabled:opacity-50">🗑 Delete</button>
        </div>
      ))}
    </div>
  );
}

type BattleState = {
  targetId: string;
  champion: string;
  qIdx: number;
  picked: number | null;
  correct: number;
  phase: "questions" | "result";
};

function ConquestMatch({ state, campaign, completedIds, onOpen, onBack, onDelete }: {
  state: State;
  campaign: Campaign;
  completedIds: Set<string>;
  onOpen: (s: Story) => void;
  onBack: () => void;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [lastResult, setLastResult] = useState<{ outcome: "conquered" | "repelled"; events: string[]; xpEarned: number } | null>(null);
  const [attackError, setAttackError] = useState<string | null>(null);

  const board = campaign.board ?? [];
  const boardMap = useMemo(() => new Map(board.map((t) => [t.id, t])), [board]);
  const active = campaign.status === "active";

  const playerInfo = (id: string): { name: string; emoji: string; color: string } =>
    id === "you"
      ? { name: "You", emoji: "🧙", color: PLAYER_COLOR }
      : campaign.rivals.find((r) => r.id === id) ?? { name: id, emoji: "🎖️", color: "#64748b" };

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of board) m.set(t.owner, (m.get(t.owner) ?? 0) + 1);
    return m;
  }, [board]);

  const attackable = useMemo(() => {
    if (!active) return new Set<string>();
    return new Set(
      board
        .filter((t) => t.owner !== "you" && (ADJACENCY[t.id] ?? []).some((n) => boardMap.get(n)?.owner === "you"))
        .map((t) => t.id),
    );
  }, [board, boardMap, active]);

  const champions = useMemo(() => {
    const party = state.party.map((p) => p.storyId).filter((id) => completedIds.has(id));
    return party.length > 0 ? party : [...new Set(state.completions.map((c) => c.storyId))];
  }, [state, completedIds]);

  const attackMut = useMutation({
    mutationFn: (args: { targetId: string; heroStoryId: string; correct: number }) =>
      api.attack({ campaignId: campaign.id, targetId: args.targetId, heroStoryId: args.heroStoryId, correct: args.correct }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["state"] });
      setLastResult({ outcome: r.outcome, events: r.events, xpEarned: r.xpEarned });
      setBattle(null);
      setSelected(null);
      setAttackError(null);
    },
    onError: () => setAttackError("That move couldn't be resolved — check your connection and try resolving the turn again."),
  });

  const inviteMut = useMutation({
    mutationFn: () => api.markInvited({ id: campaign.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
  });

  const selTerritory = selected ? boardMap.get(selected) : undefined;
  const selHero = selTerritory?.hero ? heroFor(state, selTerritory.hero) : null;
  const selStory = selTerritory?.hero ? STORIES.find((s) => s.id === selTerritory.hero) : undefined;

  const battleTarget = battle ? boardMap.get(battle.targetId) : undefined;
  const battleStory = battleTarget?.hero ? STORIES.find((s) => s.id === battleTarget.hero) : undefined;
  const battleQ = battle && battleStory ? battleStory.quiz[battle.qIdx] : undefined;

  function startBattle() {
    if (!selTerritory || !attackable.has(selTerritory.id) || champions.length === 0) return;
    setAttackError(null);
    setLastResult(null);
    setBattle({ targetId: selTerritory.id, champion: champions[0]!, qIdx: 0, picked: null, correct: 0, phase: "questions" });
  }

  function pickAnswer(i: number) {
    if (!battle || !battleQ || battle.picked !== null) return;
    setBattle({ ...battle, picked: i, correct: battle.correct + (i === battleQ.answerIndex ? 1 : 0) });
  }

  function nextQuestion() {
    if (!battle || !battleStory) return;
    if (battle.qIdx < battleStory.quiz.length - 1) {
      setBattle({ ...battle, qIdx: battle.qIdx + 1, picked: null });
    } else {
      setBattle({ ...battle, phase: "result" });
    }
  }

  /* ------------------------------ Battle view ------------------------------ */
  if (battle && battleTarget && battleStory && battleQ) {
    const defender = playerInfo(battleTarget.owner);
    const defHero = heroFor(state, battleTarget.hero!);
    const isLastQ = battle.qIdx === battleStory.quiz.length - 1;
    return (
      <div className="pt-5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setBattle(null)} aria-label="Abandon this attack" className="game-btn rounded-xl bg-[var(--surface)] px-4 py-2 font-display text-sm font-bold uppercase">← Abandon attack</button>
          <span className="font-arcade rounded-md bg-[#dc2626] px-2 py-1 text-[10px] font-black text-white">⚔️ CONQUEST BATTLE</span>
        </div>
        <h1 className="font-display mt-4 text-3xl font-bold uppercase leading-tight">Battle for {TERRITORY_NAME[battle.targetId]}</h1>
        <div className="game-card mt-3 flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-3.5">
          {defHero?.image ? <img src={defHero.image} alt={`Illustrated portrait of ${defHero.figure}`} className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : <span className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-black text-white" style={{ backgroundColor: defHero?.color ?? "#64748b" }} aria-hidden>{defHero?.initials ?? "?"}</span>}
          <div className="min-w-0">
            <p className="text-sm"><span className="font-bold" style={{ color: defender.color }}>{defender.emoji} {defender.name}</span> <span className="text-[var(--dim)]">defends with</span></p>
            <p className="font-display truncate text-xl font-bold uppercase leading-tight">{battleStory.figure}</p>
            <p className="text-xs text-[var(--dim)]">Answer questions about {battleStory.figure} to advance — 2 of 3 takes the territory.</p>
          </div>
        </div>

        <div className="mt-3">
          <p className="font-display text-sm font-bold uppercase text-[var(--dim)]">Your champion leads the attack</p>
          <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-label="Choose your champion">
            {champions.map((id) => {
              const h = heroFor(state, id);
              if (!h) return null;
              const chosen = battle.champion === id;
              return (
                <button key={id} type="button" disabled={battle.phase === "result"} onClick={() => setBattle({ ...battle, champion: id })} aria-pressed={chosen} aria-label={`Attack with ${h.figure}`}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${chosen ? "bg-[var(--accent-solid)] text-white" : "border-2 border-[var(--border)] bg-[var(--surface)]"}`}>{chosen ? "⚔️ " : ""}{h.figure}</button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-[var(--dim)]">Your champion moves in and holds the territory if you win it.</p>
        </div>

        {battle.phase === "questions" ? (
          <>
            <div className="mt-4 flex gap-1.5" aria-hidden>
              {battleStory.quiz.map((_, i) => (
                <span key={i} className={`h-3 flex-1 rounded-sm border border-[var(--border)] ${i < battle.correct ? "bg-[var(--sage-solid)]" : i <= battle.qIdx ? "xp-fill" : "bg-[var(--surface2)]"}`} />
              ))}
            </div>
            <p className="font-arcade mt-2 text-[10px] font-black tracking-widest text-[var(--dim)]">QUESTION {battle.qIdx + 1} OF {battleStory.quiz.length} · {battle.correct} CORRECT · NEED 2 TO CONQUER</p>
            <h2 className="font-display mt-1.5 text-2xl font-bold leading-snug">{battleQ.question}</h2>
            <div className="mt-4 space-y-3" role="group" aria-label="Answer choices">
              {battleQ.options.map((opt, i) => {
                const isRight = battle.picked !== null && i === battleQ.answerIndex;
                const isWrongPick = battle.picked === i && i !== battleQ.answerIndex;
                return (
                  <button key={i} type="button" onClick={() => pickAnswer(i)} disabled={battle.picked !== null} aria-label={`Answer: ${opt}`}
                    className={`w-full rounded-xl border-2 p-4 text-left text-base font-semibold ${isRight ? "border-[var(--sage-solid)] bg-[var(--sage-solid)]/15" : isWrongPick ? "border-[#dc2626] bg-[#dc2626]/10" : "game-card bg-[var(--surface)]"}`}>
                    <span className="font-arcade mr-2 text-xs font-black text-[var(--dim)]">{["A", "B", "C", "D"][i]}</span>
                    {opt} {isRight ? " 💥 HIT! ✓" : isWrongPick ? " ✗ MISS" : ""}
                  </button>
                );
              })}
            </div>
            {battle.picked !== null && (
              <div className={`mt-4 rounded-2xl border-2 p-4 ${battle.picked === battleQ.answerIndex ? "border-[var(--sage-solid)] bg-[var(--surface)]" : "border-[#dc2626] bg-[var(--surface)]"}`}>
                <p className="font-display text-lg font-bold uppercase">{battle.picked === battleQ.answerIndex ? "💥 Correct — you advance!" : "🛡️ The garrison holds"}</p>
                <p className="mt-1 text-sm">{battleQ.explanation}</p>
                <button type="button" onClick={nextQuestion} aria-label={isLastQ ? "See the battle result" : "Next question"} className="game-btn mt-3 w-full rounded-xl bg-[var(--text)] py-3 font-display font-bold uppercase text-[var(--bg)]">
                  {isLastQ ? "⚑ See the result" : "Next question →"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="game-card mt-5 rounded-2xl bg-[var(--surface)] p-5 text-center">
            <p className="text-5xl" aria-hidden>{battle.correct >= 2 ? "🏴" : "🛡️"}</p>
            <p className="font-display mt-2 text-2xl font-bold uppercase">{battle.correct >= 2 ? "Territory in reach!" : "Attack faltering"}</p>
            <p className="mt-1 text-sm text-[var(--dim)]">You answered {battle.correct} of {battleStory.quiz.length} questions about {battleStory.figure} correctly.{battle.correct >= 2 ? " Resolve the turn to claim the land and watch the rivals move." : " You need 2 — resolve the turn and the rivals will move."}</p>
            {attackError && <p className="mt-2 text-sm text-[var(--oxblood)]" role="alert">{attackError}</p>}
            <button type="button" disabled={attackMut.isPending}
              onClick={() => attackMut.mutate({ targetId: battle.targetId, heroStoryId: battle.champion, correct: battle.correct })}
              aria-label="Resolve the turn"
              className="game-btn mt-4 w-full rounded-xl bg-[#dc2626] py-3.5 font-display text-lg font-bold uppercase text-white disabled:opacity-50">
              {attackMut.isPending ? "⏳ Rivals are moving…" : "⚔️ Resolve turn"}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------ Board view ------------------------------ */
  return (
    <div className="pt-5">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} aria-label="Back to all matches" className="game-btn rounded-xl bg-[var(--surface)] px-4 py-2 font-display text-sm font-bold uppercase">← Matches</button>
        <span className="font-arcade rounded-md bg-[var(--surface2)] px-2 py-1 text-[10px] font-black text-[var(--dim)]">ROUND {campaign.round}</span>
      </div>
      <h1 className="font-display mt-3 text-3xl font-bold uppercase leading-tight">🌍 {campaign.name}</h1>

      {campaign.status === "won" && <p className="mt-3 rounded-2xl bg-[var(--gold)] px-4 py-3 font-display text-lg font-bold uppercase text-black">👑 World domination! You hold every territory.</p>}
      {campaign.status === "lost" && <p className="mt-3 rounded-2xl bg-[#dc2626] px-4 py-3 font-display text-lg font-bold uppercase text-white">💀 Your empire has fallen. Start a new conquest to try again.</p>}
      {active && <p className="mt-1.5 text-sm text-[var(--dim)]">Tap a glowing enemy territory that borders your empire to attack it.</p>}

      {/* Standings */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Standings">
        {["you", ...campaign.rivals.map((r) => r.id)].map((id) => {
          const info = playerInfo(id);
          const n = counts.get(id) ?? 0;
          return (
            <div key={id} className="game-card rounded-xl bg-[var(--surface)] px-3 py-2">
              <p className="truncate text-xs font-bold" style={{ color: info.color }}>{info.emoji} {info.name}</p>
              <p className="font-arcade text-lg font-black leading-tight">{n}<span className="text-xs text-[var(--dim)]">/16</span> {n === 0 && <span className="text-xs">💀 out</span>}</p>
            </div>
          );
        })}
      </div>

      {lastResult && (
        <div className={`mt-3 rounded-2xl border-2 p-4 ${lastResult.outcome === "conquered" ? "border-[var(--sage-solid)] bg-[var(--surface)]" : "border-[#dc2626] bg-[var(--surface)]"}`} role="status">
          <p className="font-display text-lg font-bold uppercase">{lastResult.outcome === "conquered" ? "🏴 Territory conquered!" : "🛡️ Attack repelled"}{lastResult.xpEarned > 0 ? ` · +${lastResult.xpEarned} XP` : ""}</p>
          <ul className="mt-1.5 space-y-1 text-sm text-[var(--dim)]">
            {lastResult.events.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Board */}
      {CONTINENTS.map((cont) => {
        const holderIds = cont.territories.map((t) => boardMap.get(t.id)?.owner);
        const soleHolder = holderIds.every((o) => o && o === holderIds[0]) ? holderIds[0]! : null;
        return (
          <section key={cont.id} className="mt-5" aria-label={cont.name}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-bold uppercase">{cont.emoji} {cont.name}</h2>
              {soleHolder && <span className="font-arcade text-[10px] font-black" style={{ color: playerInfo(soleHolder).color }}>HELD BY {playerInfo(soleHolder).name.toUpperCase()}</span>}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {cont.territories.map((t) => {
                const cell = boardMap.get(t.id);
                if (!cell) return null;
                const owner = playerInfo(cell.owner);
                const hero = cell.hero ? heroFor(state, cell.hero) : null;
                const isTarget = attackable.has(t.id);
                const isSel = selected === t.id;
                return (
                  <button key={t.id} type="button" onClick={() => setSelected(isSel ? null : t.id)} aria-pressed={isSel}
                    aria-label={`${t.name}, held by ${owner.name}${hero ? `, defended by ${hero.figure}` : ""}${isTarget ? ". Attackable — tap for details" : ""}`}
                    className={`game-card overflow-hidden rounded-xl bg-[var(--surface)] text-left ${isSel ? "!border-[var(--text)]" : ""} ${isTarget ? "!border-[#dc2626]" : ""}`}>
                    <span className="block h-1.5" style={{ backgroundColor: owner.color }} aria-hidden />
                    <span className="block p-2.5">
                      <span className="flex items-center justify-between gap-1">
                        <span className="font-display truncate text-sm font-bold uppercase leading-tight">{t.name}</span>
                        {isTarget && <span aria-hidden>⚔️</span>}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1.5">
                        {hero?.image ? <img src={hero.image} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" /> : <span className="font-display flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white" style={{ backgroundColor: hero?.color ?? "#64748b" }} aria-hidden>{hero?.initials ?? "?"}</span>}
                        <span className="min-w-0">
                          <span className="block truncate text-[11px] font-bold leading-tight">{hero?.figure ?? "No garrison"}</span>
                          <span className="block truncate text-[10px] font-semibold leading-tight" style={{ color: owner.color }}>{owner.emoji} {owner.name}</span>
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Selected territory detail */}
      {selTerritory && (
        <div className="game-card mt-5 rounded-2xl bg-[var(--surface)] p-4">
          <div className="flex items-center gap-3">
            {selHero?.image ? <img src={selHero.image} alt={`Illustrated portrait of ${selHero.figure}`} className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : <span className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-black text-white" style={{ backgroundColor: selHero?.color ?? "#64748b" }} aria-hidden>{selHero?.initials ?? "?"}</span>}
            <div className="min-w-0">
              <p className="font-display text-xl font-bold uppercase leading-tight">{TERRITORY_NAME[selTerritory.id]}</p>
              <p className="text-sm text-[var(--dim)]">Held by <span className="font-bold" style={{ color: playerInfo(selTerritory.owner).color }}>{playerInfo(selTerritory.owner).emoji} {playerInfo(selTerritory.owner).name}</span>{selHero ? <> · defended by <span className="font-bold text-[var(--text)]">{selHero.figure}</span> (⚡ {selHero.trait})</> : ""}</p>
            </div>
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[var(--dim)]">Borders</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(ADJACENCY[selTerritory.id] ?? []).map((n) => {
              const o = boardMap.get(n)?.owner;
              return <span key={n} className="rounded-md bg-[var(--surface2)] px-2 py-1 text-[11px] font-bold">{TERRITORY_NAME[n]}{o ? <span style={{ color: playerInfo(o).color }}> · {playerInfo(o).name}</span> : ""}</span>;
            })}
          </div>
          {active && selTerritory.owner !== "you" && (
            attackable.has(selTerritory.id) ? (
              <div className="mt-4">
                <button type="button" onClick={startBattle} aria-label={`Attack ${TERRITORY_NAME[selTerritory.id]}`} className="game-btn w-full rounded-xl bg-[#dc2626] py-3 font-display text-lg font-bold uppercase text-white">⚔️ Attack — answer about {selHero?.figure ?? "its hero"}</button>
                {selStory && !completedIds.has(selStory.id) && (
                  <div className="mt-2.5 rounded-xl bg-[var(--surface2)] px-3 py-2.5">
                    <p className="text-xs font-semibold">📖 You haven't studied {selStory.figure} yet — their questions will be tough. Read the story first to fight with an edge.</p>
                    <button type="button" onClick={() => onOpen(selStory)} aria-label={`Read the story of ${selStory.figure}`} className="mt-1.5 text-xs font-black uppercase text-[var(--accent-text)]">Read {selStory.figure}'s story →</button>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm font-semibold text-[var(--dim)]">🔒 Too far from your empire — conquer a bordering territory first to reach it.</p>
            )
          )}
          {active && selTerritory.owner === "you" && <p className="mt-3 text-sm font-semibold text-[var(--dim)]">🏴 Your territory. {selHero ? `${selHero.figure} holds it — rivals must answer questions about them to take it.` : ""}</p>}
        </div>
      )}

      {/* Invite + log */}
      <div className="game-card mt-5 rounded-2xl bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-base font-bold uppercase">📨 Invite friends</p>
          <span className="font-arcade rounded-md bg-[var(--surface2)] px-2.5 py-1 text-sm font-black">{campaign.inviteCode}</span>
          {campaign.invitedAt ? (
            <span className="rounded-md bg-[var(--sage-solid)] px-2 py-1 text-[11px] font-black text-white">INVITE SENT ✓</span>
          ) : (
            <button type="button" disabled={inviteMut.isPending} onClick={() => inviteMut.mutate()} aria-label="Mark the invite as sent" className="game-btn rounded-xl bg-[var(--cyan-solid)] px-3.5 py-2 font-display text-sm font-bold uppercase text-white disabled:opacity-50">Mark invite sent</button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-[var(--dim)]">Friends join a match with this code in the full game. In this prototype the rival commanders hold their seats — your heroes and territories play exactly the same.</p>
      </div>

      <div className="mt-5">
        <h2 className="font-display text-xl font-bold uppercase">📜 War log</h2>
        <ul className="mt-2 space-y-1.5">
          {campaign.log.slice(0, 12).map((e, i) => (
            <li key={i} className="rounded-xl bg-[var(--surface)] px-3 py-2 text-sm text-[var(--dim)]">{e}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-4 text-center">
        <button type="button" onClick={onDelete} aria-label={`Delete match ${campaign.name}`} className="rounded-lg bg-[var(--surface2)] px-4 py-2 text-xs font-bold">🗑 Abandon & delete this match</button>
      </div>
    </div>
  );
}

/* ------------------------------- AI Lab ------------------------------- */

const AI_IDEAS = ["Ada Lovelace", "The fall of the Berlin Wall", "Simón Bolívar", "The Wright brothers' first flight", "Hatshepsut, Egypt's female pharaoh", "The eruption of Vesuvius"];

function AiTab({ state, onOpenGen }: { state: State; onOpenGen: (g: GenStory) => void }) {
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const genMut = useMutation({
    mutationFn: (t: string) => api.generateStory({ topic: t }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["state"] });
      setTopic("");
      onOpenGen(r.story);
    },
    onError: () => setErr("The AI couldn't build that story just now. Try a different figure or event."),
  });
  const delMut = useMutation({
    mutationFn: (id: number) => api.deleteGenerated({ id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
  });

  return (
    <div className="pt-5">
      <p className="font-arcade text-[10px] font-black tracking-widest text-[var(--cyan)]">ENDLESS MODE · POWERED BY AI</p>
      <h1 className="font-display mt-1 text-4xl font-bold uppercase leading-none">🤖 AI Lab</h1>
      <p className="mt-1.5 text-sm text-[var(--dim)]">The quest board never runs out. Name any figure or event and AI forges a brand-new quest — story, narration text, and boss quiz included.</p>

      <form
        className="game-card mt-4 rounded-2xl bg-[var(--surface)] p-4"
        onSubmit={(e) => { e.preventDefault(); setErr(null); if (topic.trim().length >= 2) genMut.mutate(topic.trim()); }}
      >
        <label htmlFor="ai-topic" className="font-display text-base font-bold uppercase">🎯 Choose your target</label>
        <input id="ai-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Amelia Earhart, the moon landing…" maxLength={120}
          className="mt-2 w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-base outline-none focus:border-[var(--cyan-solid)]" />
        <button type="submit" disabled={genMut.isPending || topic.trim().length < 2} aria-label="Generate story with AI"
          className="game-btn mt-3 w-full rounded-xl bg-[var(--cyan-solid)] py-3.5 font-display text-lg font-bold uppercase text-white disabled:opacity-50">
          {genMut.isPending ? "⏳ Forging your quest…" : "⚡ Summon story"}
        </button>
        {genMut.isPending && <p className="mt-2 text-center text-xs text-[var(--dim)]">Forging chapters and quiz questions from established historical facts — about 20 seconds…</p>}
        {err && <p className="mt-2 text-center text-sm text-[var(--oxblood)]" role="alert">{err}</p>}
      </form>

      <p className="font-display mt-5 text-base font-bold uppercase">💡 Quest ideas</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {AI_IDEAS.map((idea) => (
          <button key={idea} type="button" onClick={() => { setTopic(idea); }} aria-label={`Use idea: ${idea}`}
            className="rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold">{idea}</button>
        ))}
      </div>

      <h2 className="font-display mt-7 text-2xl font-bold uppercase">Your custom quests ({state.generated.length})</h2>
      {state.generated.length === 0 && <p className="mt-2 text-sm text-[var(--dim)]">None summoned yet. Your first AI quest will live here — playable and quizzable like any quest on the board.</p>}
      <div className="mt-3 space-y-3">
        {state.generated.map((g) => (
          <div key={g.id} className="game-card rounded-2xl bg-[var(--surface)] p-4">
            <button type="button" onClick={() => onOpenGen(g)} aria-label={`Open AI story ${g.title}`} className="block w-full text-left">
              <p className="font-arcade text-[10px] font-black uppercase tracking-wider text-[var(--cyan)]">AI-GENERATED · {g.era}</p>
              <p className="mt-1 font-display text-lg font-bold leading-snug">{g.title}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-[var(--dim)]">{g.summary}</p>
              <p className="mt-1.5 text-xs font-bold text-[var(--dim)]">⏱ {g.minutes} min · {new Date(g.created_at).toLocaleDateString()} · <span className="text-[var(--accent-text)]">+50 XP</span></p>
            </button>
            <button type="button" onClick={() => delMut.mutate(g.id)} aria-label={`Delete AI story ${g.title}`} className="mt-2 text-xs font-bold text-[var(--oxblood)]">🗑 Delete quest</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Pro tab ------------------------------- */

function ProTab({ state, busy, onUpgrade, onDowngrade }: {
  state: State;
  busy: boolean;
  onUpgrade: (plan: string) => void;
  onDowngrade: () => void;
}) {
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const isPro = state.membership === "pro";
  const queryClient = useQueryClient();
  const resetMut = useMutation({
    mutationFn: () => api.resetProgress({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
  });

  const rows: [string, string, string][] = [
    ["Quests per day", "1 new quest", "Unlimited"],
    ["Quest board", "5 free quests", "All quests + campaigns"],
    ["AI Lab summons", "Included in prototype", "Priority forging"],
    ["Hero cards", "Rare heroes", "Every hero incl. Legendary"],
    ["World Domination multiplayer", "Included", "Included"],
    ["Offline listening", "—", "Included"],
    ["New quests weekly", "—", "Included"],
  ];

  return (
    <div className="pt-5">
      <div className="overflow-hidden rounded-2xl border-2 border-[var(--gold)] bg-[#111827] text-white">
        <div className="p-6">
          <p className="font-arcade text-[10px] font-black tracking-widest text-[var(--gold)]">👑 CHRONICLE PRO · BATTLE PASS</p>
          <h1 className="font-display mt-2 text-4xl font-bold uppercase leading-none">All of history.<br />No locked doors.</h1>
          <p className="mt-2 text-sm text-white/80">Every quest, every campaign, every legendary hero — plus new AI-generated quests every week.</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["🔓 All quests", "★ Legendary heroes", "🤖 Priority AI", "🎧 Offline listening"].map((perk) => (
              <span key={perk} className="rounded-md bg-white/10 px-2 py-1 text-xs font-bold">{perk}</span>
            ))}
          </div>
        </div>
      </div>

      {isPro ? (
        <div className="game-card mt-4 rounded-2xl bg-[var(--surface)] p-5 text-center">
          <p className="text-5xl" aria-hidden>👑</p>
          <p className="font-arcade mt-2 text-[10px] font-black tracking-widest text-[var(--accent-text)]">BATTLE PASS ACTIVE</p>
          <p className="font-display mt-1 text-2xl font-bold uppercase">You're Pro{state.plan ? ` — ${state.plan === "yearly" ? "Yearly" : "Monthly"} plan` : ""}</p>
          <p className="mt-1 text-sm text-[var(--dim)]">Prototype membership is active. Every quest on the board is unlocked — go clear them all.</p>
          <button type="button" disabled={busy} onClick={onDowngrade} aria-label="Switch back to free plan" className="mt-4 rounded-xl border-2 border-[var(--border)] px-5 py-2.5 font-display text-sm font-bold uppercase">Switch back to Free</button>
        </div>
      ) : (
        <>
          <div className="game-card mt-4 rounded-2xl bg-[var(--surface)] p-4" aria-label="How the free trial works">
            <p className="font-display text-base font-bold uppercase">🎁 How your free trial works</p>
            <ol className="mt-3 space-y-3">
              {[
                ["Today", "Unlock everything, free"],
                ["Day 5", "We remind you the trial is ending"],
                ["Day 7", "Billing starts — cancel anytime before"],
              ].map(([d, t], i) => (
                <li key={d} className="flex items-center gap-3">
                  <span className="font-arcade flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-solid)] text-sm font-black text-white">{i + 1}</span>
                  <p className="text-sm"><span className="font-bold">{d}:</span> {t}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3" role="group" aria-label="Choose a plan">
            <button type="button" onClick={() => setPlan("monthly")} aria-pressed={plan === "monthly"} aria-label="Monthly plan, 12 dollars 99 per month"
              className={`game-card rounded-2xl p-4 text-left ${plan === "monthly" ? "!border-[var(--accent-solid)] bg-[var(--surface)]" : "bg-[var(--surface)]"}`}>
              <p className="font-display text-sm font-bold uppercase">Monthly</p>
              <p className="font-arcade mt-1 text-2xl font-black">$12.99</p>
              <p className="text-xs text-[var(--dim)]">per month</p>
            </button>
            <button type="button" onClick={() => setPlan("yearly")} aria-pressed={plan === "yearly"} aria-label="Yearly plan, 59 dollars 99 per year, save 62 percent"
              className={`game-card relative rounded-2xl p-4 text-left ${plan === "yearly" ? "!border-[var(--gold)] bg-[var(--surface)]" : "bg-[var(--surface)]"}`}>
              <span className="font-arcade absolute -top-2.5 right-3 rounded bg-[#dc2626] px-2 py-0.5 text-[10px] font-black text-white">SAVE 62%</span>
              <p className="font-display text-sm font-bold uppercase">Yearly ⭐ Best value</p>
              <p className="font-arcade mt-1 text-2xl font-black">$59.99</p>
              <p className="text-xs text-[var(--dim)]">per year · $5.00/mo</p>
            </button>
          </div>

          <button type="button" disabled={busy} onClick={() => onUpgrade(plan)} aria-label="Start 7 day free trial"
            className="game-btn mt-4 w-full rounded-xl bg-[var(--accent-solid)] py-4 font-display text-xl font-bold uppercase text-white disabled:opacity-50">
            {busy ? "Activating…" : "👑 Start 7-day free trial"}
          </button>
          <p className="mt-2 text-center text-xs text-[var(--dim)]">Prototype: no card, no charge — this just flips your membership so you can test the paywall both ways.</p>
        </>
      )}

      <div className="game-card mt-6 overflow-hidden rounded-2xl bg-[var(--surface)]">
        <table className="w-full text-sm" aria-label="Free versus Pro comparison">
          <thead>
            <tr className="border-b-2 border-[var(--border)] text-left">
              <th className="p-3.5 font-display font-bold uppercase text-[var(--dim)]">Perk</th>
              <th className="p-3.5 font-display font-bold uppercase">Free</th>
              <th className="p-3.5 font-display font-bold uppercase text-[var(--accent-text)]">👑 Pro</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([f, free, pro]) => (
              <tr key={f} className="border-b border-[var(--border)] last:border-0">
                <td className="p-3.5 font-semibold">{f}</td>
                <td className="p-3.5 text-[var(--dim)]">{free}</td>
                <td className="p-3.5 font-bold">{pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 border-t border-[var(--border)] pt-4 pb-2 text-center">
        <p className="text-xs text-[var(--dim)]">Prototype tools — start over to test the new-player experience:</p>
        <button type="button" disabled={resetMut.isPending} onClick={() => resetMut.mutate()} aria-label="Reset all prototype progress"
          className="mt-2 rounded-lg bg-[var(--surface2)] px-4 py-2 text-xs font-bold">↺ Reset progress, XP & membership</button>
      </div>
    </div>
  );
}
