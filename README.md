# HistoryIsFun — "Chronicle"

A gamified, AI-powered history-learning app prototype, modeled on the
"Duolingo for history" idea: five-minute narrated stories about historical
figures, a quiz at the end of each story, collectible heroes, and a
membership tier (free vs. Pro).

## What's inside

- **Story quests** — 10 five-minute stories (Cleopatra, Julius Caesar,
  Leonardo da Vinci, Abraham Lincoln, Nikola Tesla, Genghis Khan,
  Joan of Arc, Harriet Tubman, Marie Curie, Frida Kahlo), each paged like a
  mini-chapter book with recorded narration and a 3-question quiz.
- **Game layer** — XP, levels, daily streaks, difficulty stars, and a
  player HUD. Quizzes play as "Boss Fights" with an HP bar.
- **Hero Roster** — finishing a story unlocks that figure's collectible
  card (with RARE / LEGENDARY rarities) *and* their avatar.
- **AI Lab** — type any figure or event and a new story + quiz is generated
  on the spot.
- **Arena (multiplayer)** — a world-domination conquest game on a
  16-territory map. Every territory is garrisoned by one of its owner's
  heroes; to advance into a territory you must answer questions about the
  hero holding it. Unlocked avatars form your battle party.
- **Membership** — free tier (5 stories) vs. Pro "Battle Pass"
  ($12.99/month or $59.99/year, 7-day trial) gating the rest of the library.

## Tech

- React + TypeScript client (`client/`)
- Bun server actions (`server/src/actions.ts`) with a Drizzle/SQLite
  schema (`server/src/schema.ts`, migrations in `drizzle/`)
- Scripts (Bun): `bun run build`, `bun run typecheck`

## Note on media assets

This snapshot contains the source code only. The generated media the code
references by name — hero portraits (`client/src/assets/*.webp`) and the
recorded narration (`client/src/assets/audio/*.mp3`, 40 chapters) — are
binary files and are not included here.

## Status

Working prototype built with Muse (Meta AI). Not yet a store release:
real accounts, payments, and cross-device multiplayer are future work.
