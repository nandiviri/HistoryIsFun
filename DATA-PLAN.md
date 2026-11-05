# Data Plan

## Context provenance
- `I want to make something like the Paladin app that is focused on history and is developed through AI but it has a membership level.` (verbatim build request; defines core: Paladin-style history learning, AI-generated content twist, membership tier)
- `prototype first.` (verbatim build request; scope is a tappable working prototype, not a business plan or production billing)
- `Paladin: Learn History is a history learning app with short narrated stories, animations, quizzes, and collectible characters based on historical figures.` (builder-discovered from web search; shapes story/quiz/collection features)
- `Pro Monthly Subscription $12.99, Pro Yearly up to $89.99, 7-day free trial soft paywall` (builder-discovered from App Store listing via search; informs prototype pricing tiers and paywall timeline — presented as prototype pricing, user can edit concept later)

## Tested sources
### Paladin app research (browser.search)
**Used by**: product design — no runtime fetch; informs IA and features
**Test command**: `browser.search: Paladin Learn History app features stories quizzes subscription`
**Sample output**: Short 5-min narrated lessons about Cleopatra, Lincoln etc.; quizzes after each lesson; collectible characters; Paths guided journeys; 1v1 battles noted; Pro $12.99/mo; soft paywall with 7-day trial timeline, monthly vs yearly with Save 42%
**Processing**: Distilled into prototype features: Home with daily story + streak, Library by era, Story reader as paged cards with narration UI, Quiz, Collection, Paths, AI Lab, Membership paywall. No Paladin branding, copy, or assets reused — original name and content.

## Web-search sources
### Paladin feature/pricing landscape
**Delivered by**: design only (not a runtime action)
**Checked with**: browser.search returned App Store, Google Play, Nibble review, ScreensDesign showcase with concrete feature and pricing details listed above
**URLs preserved verbatim from search**:
- https://apps.apple.com/us/app/paladin-learn-history/id6511242367
- https://play.google.com/store/apps/details?id=com.learnpaladin&hl=en-US
- https://nibble-app.com/blog/paladin-app-review
- https://screensdesign.com/showcase/paladin-learn-history

## Historical content
- Seed catalog is original short narratives written from well-established historical facts (Cleopatra, Julius Caesar, Leonardo da Vinci, Marie Curie, Abraham Lincoln, Joan of Arc, Genghis Khan, Harriet Tubman, Nikola Tesla, Frida Kahlo, etc. — dates, places, and major events are textbook facts). Each story: 4-5 paged chapters, a primary-source-style quote note where famous and verifiable, and a 3-question quiz whose answers are contained in the story text. No invented quotes, statistics, or obscure claims; famous quotes used only where widely documented (e.g. Lincoln, Curie).
- AI Lab generation: server action uses `ctx.inference.complete` to generate a new story + quiz on a user-typed figure/event at runtime; output is labeled `AI-generated prototype` in the UI so it is never presented as vetted editorial content.

## Narration audio (added 2026-11-05, fix for "Can't listen to narration")
- Diagnosis: the reader narrated with the viewer's device `speechSynthesis`, which is unreliable/silent inside embedded webviews (no voices loaded, stuck queue, no error surfaced) — the button appeared to work but produced no sound.
- Fix: each built-in library story chapter (10 stories × 4 chapters = 40 units) was recorded at build time with the bundled speech tool (`/opt/hatch/bin/tts speak`, voice Helio `avocado_v2:MAI_03`, English), speaking exactly the chapter heading + text shown in the reader. Files live as owned assets under `client/src/assets/audio/<story>-<chapter>.mp3` (20–32s each, ~8.1 MB total), are mapped in `client/src/narration.ts`, and play from a native `<audio controls>` element in the reader — one recording at a time, chapter change stops the previous one.
- AI-generated stories are runtime text with no fixed recording, so they keep device `speechSynthesis` for their actual text, hardened: an English voice is selected explicitly, a periodic pause/resume works around the Chrome/Android stall, and failures now surface a visible message instead of failing silently.

## Freeze-on-open fix (2026-11-05, fix for "Opening stories freezes the app")
- Diagnosis: regression from the narration fix above. The hardened reader touched `window.speechSynthesis` unconditionally on every story open — a mount-time `getVoices()` + `voiceschanged` preload effect, plus `cancel()` calls from the page-change effect, chapter navigation, and unmount cleanup — even for built-in stories that use recorded MP3s and never need device speech. In the phone WebView the artifact runs in, those calls can stall the renderer when the device's speech service is slow or absent, freezing the app the moment any story opens. The audit's headless Chromium does not reproduce it (reader renders and settles there), which is consistent with a WebView speech-service stall rather than a render/logic bug; catalog data, MP3 assets (valid MPEG Layer III), React Query state, and the audio element were all checked and are not the cause.
- Fix: the reader now tracks whether device speech was ever started (`speechUsedRef`). `speechSynthesis` is contacted only inside the AI-story Listen tap handler (where the voice list is awaited once via `voiceschanged` with a 700 ms fallback, all wrapped in try/catch with a visible error message). `stopSpeak`/cleanup only call `cancel()` when speech was actually used. Built-in stories opening, paging, and closing now make zero speechSynthesis calls; recorded-audio playback is unchanged.

## Gamer-friendly UI pass (2026-11-05, "modify the ui to be more gamer friendly")
- Pure presentation change — no data, actions, catalog, XP values, or narration logic changed (the reader's speechSynthesis guard from the freeze fix is untouched).
- Theme: parchment/serif academic look replaced with a game palette (deep navy dark mode, cool slate light mode, amber-gold XP accent, cyan AI accent, red boss accent), Rajdhani display type + Orbitron numeric/arcade labels, chunky 2px-bordered cards with hard offset shadows and press-down buttons (`.game-card` / `.game-btn`), striped XP-bar fill.
- Game vocabulary mapped onto existing real mechanics only: stories = quests (Quest Board), chapters = stages with a segmented progress bar, quiz = Boss Fight with a Boss HP bar that drops by 1 per correct answer (derived live from the existing score state) and HIT/MISS feedback, completion = Victory screen with 0–3 stars from the actual quiz score and a "loot" XP card, collection = Hero Roster with RARE/LEGENDARY rarity tags (Pro-tier stories = Legendary, gold border) and an unlock progress bar, paths = Campaigns with node-map progress, Pro = Battle Pass. Home header is a player HUD: avatar tile with LV badge, striped XP bar, and stat tiles for streak / quests cleared / heroes won — all from the existing `getState` data.
- Bottom nav relabeled Base / Quests / Heroes / AI Lab / Pass with an amber active pill; tab ids and aria labels kept functional.

## Hero avatars → battle party (2026-11-05, "Every time you learn about a character you get the avatar for multi-player campaigns")
- Completing a story + boss quiz already unlocked the hero card; now the unlocked avatar can be added to a persistent **battle party** (`party_members` table, `toggleParty` action — server verifies the story is actually completed before a hero can join). Entry points: the quiz Victory screen ("Add to battle party"), each collected card in the Hero Roster, and the Arena party manager. Home shows a party strip once the party is non-empty.
- `campaigns` table + `createCampaign`/`markInvited`/`deleteCampaign` actions came with this pass (lobby + invite code); the conquest design below supersedes the lobby's "quest race" framing — lobby-only campaigns (no board) still render in the Arena with a delete option.

## Multiplayer = world-domination conquest (2026-11-05, design clarification from the user)
- Verbatim: `Multi player is a world domination style game where players are asked about each other character in order to advance`. So a campaign is a Risk-style conquest match, not a quest race.
- Board: 16 territories in 4 continents (Ancient World, Medieval Realms, Renaissance Europe, Modern World), rendered as labeled tile sections — a stylized game board, deliberately not a drawn geographic map (per the no-hand-authored-maps rule). Adjacency is data (`client/src/board.ts`; server keeps its own copy of ids/links/names in `actions.ts` for validation and rival simulation).
- Setup (`createMatch`): the board is shuffled and dealt 4 territories each to the player + 3 rival commanders; every territory is garrisoned by one of its owner's heroes (yours = your battle party, or all unlocked heroes if the party is empty; the server re-validates hero ids against real completions).
- Core mechanic: to advance into an enemy territory bordering your empire, you answer that territory's garrison hero's 3 story-quiz questions; 2+ correct conquers it (+15 XP, your chosen champion hero moves in as the new garrison). After your move, each rival takes one simulated attack (42% success, biased toward the player's land) — in the real game those seats are friends answering questions about YOUR heroes; in this prototype the rivals are labeled AI stand-ins and the invite code is the lobby mechanism friends would join with. First to hold all 16 wins (+100 XP); holding 0 eliminates a commander. Match state (board, rivals, war log capped at 40, status, round) persists in the `campaigns` row (migration 0004); resolution lives in the `attack` action so rival turns and win/loss checks stay consistent.
- The battle screen hints when you haven't studied the defending hero yet and links straight to their story — learning a character is literally how you get stronger against them.

## Imagery
- Portrait illustrations: generated in Build with `media.generate_image` in a painted, editorial illustration style (not photorealistic) for hero + featured figures, saved under `client/src/assets/` and imported. Historical figures are depicted as stylized illustrations, clearly artwork, not photographs. Remaining figures use era-colored monogram tiles so a missing image never breaks layout.
- Imagery needed: yes — education/lifestyle artifact is image-forward per guidance; hero illustration + figure portraits are the visual anchor.
- Full portrait set (2026-11-05, user said "Generate" when offered generated portraits vs connecting Canva/Figma/Runway): the 7 figures that still had monogram tiles — Caesar, Genghis Khan, Joan of Arc, Harriet Tubman, Abraham Lincoln, Nikola Tesla, Frida Kahlo — got portraits in the same watercolor-and-ink, ink-splattered parchment style as the existing Cleopatra/Leonardo/Curie art, each keyed to its story's accent color and signature props (laurel wreath & gladius; fur-trimmed lamellar armor & bow over the steppe; plate armor, white banner & halo; headscarf, shawl & lantern under the North Star; stovepipe hat & Civil War-era flag; Tesla coil with arcing electricity; Tehuana dress, flower crown & monkey). Files: `client/src/assets/{caesar,genghis,joan,tubman,lincoln,tesla,kahlo}.webp` (1120×2240, Lincoln 1280×1920), imported in `catalog.ts`. Every built-in story now has a portrait; each was visually inspected — correct subject, no baked-in text or watermark. No connector was connected for this; generation used the built-in media tool as the user chose.

## Long-term data behavior
- **Refresh policy**: No external live data and no cron. Catalog is static prototype content. User progress persists in DB and loads on open.
- **Growth**: One `user_state` row (membership, xp, streak, last_study_date), `completions` rows per finished story/quiz, `generated_stories` rows accumulate only when user uses AI Lab.
- **Ordering**: Library grouped by era chronologically; generated stories newest first; collection ordered by story order.
- **Time semantics**: Streak computed from America/New_York calendar dates stored as YYYY-MM-DD; XP/level are cumulative counters, not timestamps.

## Rejected approaches
- **Tried**: Mirroring Paladin name/branding directly
  **Why rejected**: This is Hernando's own product concept inspired by Paladin; ships under a working prototype name (Chronicle) with original copy and art.
- **Tried**: Real payment integration for membership
  **Why rejected**: Prototype first — membership is a simulated tier toggle persisted in DB that actually gates Pro stories, with a full paywall/pricing screen; no real billing in a prototype.
- **Tried**: Fetching Wikipedia at runtime for stories
  **Why rejected**: Unreliable formatting/quiz generation; curated seed stories guarantee a coherent reader+quiz flow offline, AI Lab covers the on-demand long tail.
