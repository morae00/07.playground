# Architecture

## Dependency direction

```text
content -> engine contracts/world types -> simulation (GameEngine) -> game events + RenderWorld
  input adapter -> engine commands -----/                    |              |
                                        presentation (particles, numbers, shake, sound cues) <-+
                                        world renderer (RenderWorld + presentation) -> Canvas
                                        app mixer (one AudioContext, buses, limiter) <- cues from presentation and UI
platform -----------------------------------------------------------> application shell
```

## Rules

1. Content and engine modules do not import React, DOM, Canvas, or Electron APIs.
2. Input adapters translate keyboard, pointer, touch, and gamepad state into engine commands.
3. Rendering consumes immutable snapshots and visual contracts. It does not decide combat outcomes.
4. UI state owns navigation, focus, dialogs, and options, but not simulation state.
5. Platform modules own persistence, packaging boundaries, and release metadata.
6. Seeded gameplay randomness is isolated from cosmetic randomness so visual changes cannot alter outcomes.
7. New integration tests use public commands, snapshots, and diagnostics. Direct private-field mutation is transitional and must not expand.
8. Player-facing words live in the locale files, not in code (UI-10). Content and engine modules name strings by key; only the UI resolves them.

## Input and commands (TEC-07)

`src/ui/inputAdapter.ts` owns the keyboard, pointer, and gamepad devices at the application level. It maps keys to the four movement actions (`ENGINE_ACTIONS`), pointer drags to world targets through `GameEngine.screenToWorld`, and the gamepad stick to analog movement, polling pads in `EngineCallbacks.onFrameStart`. The gamepad Start button is a UI event (`onPauseIntent`), not an engine command. The engine accepts input only through `GameEngine.dispatch(command)` with the commands in `src/game/engine/contracts.ts`; it registers no keyboard or pointer listeners. Draft cards carry an `offerId`, so `draft/select` commands can pick them from a log.

Outside active play the gamepad drives the UI (`src/ui/useGamepadNavigation.ts`, UI-07). In play it only moves the hero and pauses with Start (G1).
- The D-pad or the left stick moves the focus ring to the nearest control in that direction. On a slider or a select, left and right change the value instead.
- A confirms, B goes back (as Escape), and LB / RB switch the tabs in view (the menu tabs, the pause hub tabs).
- The first press with nothing focused only lands on the preferred control: a draft card, the dialog's primary action, or the start button. A stray A cannot pick what the player has not seen (BUG-05).
- The device used last (`src/ui/inputDevice.ts`) picks the glyphs prompts show (`Glyph`, `glyph.<device>.<action>` strings): Enter and Esc on the keyboard, A and B on an Xbox-layout pad, ✕ and ○ on a PlayStation pad (Sony's vendor id or name). A key or pointer press hands the glyphs back to the keyboard.

## Simulation, presentation, and rendering (TEC-02)

The simulation reports what happened as game events (`src/game/engine/events.ts`: hits, kills, casts, pickups, boss phases, telegraphs, enrage, and so on) through `GameEngine.emit`; tools subscribe with `GameEngine.subscribe`. `src/game/presentation/presentation.ts` consumes the events and owns every cosmetic: particles, damage numbers, impact rings, screen shake, and the sound cues the app mixer plays (AUD-01, below). It keeps its own seeded cosmetic random stream, and its effects age with frame time or with simulation steps exactly as before the split. The simulation never reads presentation state back. Under classic rules the presentation draws particle and damage-number ids from the gameplay counter, which keeps 0.1.0 runs bit-identical; remaster rules use a separate cosmetic counter (BUG-08).

Each frame the engine builds a read-only `RenderWorld` (`src/game/render/worldRenderer.ts`) with live references to the simulation arrays plus the presentation state, and `WorldRenderer` draws it. The renderer never sees the engine, so it cannot change outcomes, and tests can draw hand-built worlds. Entity and effect types live in `src/game/engine/worldTypes.ts` (types only), so renderers and presentation import neither the engine nor each other's internals. The app shell watches the operating system's reduced-motion preference and passes it in with `setSystemReducedMotion`.

## Audio (AUD-01)

`src/game/audio/mixer.ts` owns the only `AudioContext` of the app session. The app shell creates the mixer when it loads and gives it to every engine (`GameEngine.setSound`); engines and app remounts come and go, and the context stays. It opens on the first pointer or key press, because browsers start audio only after a gesture, and never while the master volume is zero. Every sound goes through a bus, the master gain, and a limiter (`DynamicsCompressorNode`) to the speakers:

- Bus levels come from the save v3 options: music and ambience follow `musicVolume`, sfx and ui follow `sfxVolume`, and the master gain carries `volume`.
- The master gain divides out the limiter's automatic makeup gain, so one voice plays at its 0.1.0 level and only pile-ups are caught.

`src/game/audioPolicy.ts` lists every cue with its bus, priority, voice limit, spacing, and synth tone: hits by impact tier, kills, casts, draft results, stingers, and UI. The presentation turns game events into cue names and stereo positions; `PresentationHost.pan` says where the event sits across the screen. The mixer applies the voice rules on the audio clock:

- Spacing per cue group; hits share one group.
- A voice limit per cue; one more voice replaces the oldest.
- At most 16 voices in all. A new cue takes the oldest voice of the lowest priority, or stays silent if every voice outranks it.

Pitch variation comes from the mixer, not the cosmetic stream, so sounds never move particles. Classic rules keep 0.1.0's per-hit draw on the cosmetic stream, because classic particle ids feed gameplay ids. `src/ui/uiSounds.ts` plays button clicks on the ui bus; a button can choose `data-sound="cancel"`, or `"none"` when its action already makes a game sound. A sound pack (`AudioMixer.loadPack`, audio files per cue with variants) replaces a cue's synth tone once it is decoded.

The v0 pack (AUD-02) covers the first 33 cues, with three to four variants for hits and pickups:
- It is placeholder sound design in the paper-and-ink tone. `art/sfx-spec.mjs` holds a recipe per cue, and `npm run build:sfx` renders them in plain JavaScript into 16-bit mono WAV under `public/assets/packs/sfx-common`, so a rebake is byte-identical.
- Files are normalized to `SAMPLE_PEAK`, and the mixer plays them back at the level the synth tone had.
- Recorded sounds from the SFX library order replace files by name, with no code change.
- A cue whose file fails to load keeps its synth tone.

AUD-04 adds the chapters' sounds to the same pack (v0 too; music waits for a composer):
- Ch2-5 enemies die in their chapter's material: iron, water, clockwork, and eclipse glass (`KILL_CUES`); Ch1 keeps the paper tear. `PresentationHost.chapter` tells the presentation which one.
- Each of the 11 boss patterns has its own sound, played on the new `boss/attack` event when a telegraphed pattern, a dash, a shock, or an eclipse wall fires. Classic rules keep 0.1.0's silence there, since their old pattern paths do not emit it.
- Each chapter has an 8 s ambience bed. The baker renders it a second longer and folds that tail over its head, so it loops without a seam. `AudioMixer.ambience(cue)` loops the chapter's bed on the ambience bus from the run's start and fades it over 1.2 s into the next; the menu fades it out. A bed asked for before it decodes starts once it does.
- The pack is 3.0 MiB of install assets (the beds are 1.7 MiB of it). Adding the new recipes after the old ones keeps every earlier file byte-identical.

## Render layers (TEC-12)

`WorldRenderer` draws the world in the fixed layer order `WORLD_LAYERS` (`src/game/render/worldRenderer.ts`):

- ground, hazards, ground marks (foot shadows, the player's foot ring, ranged-enemy rings), pickups, target guide, and obstacle shadows;
- bodies, depth-sorted by the y of their feet (enemies, bosses, the player, mirror clones, and obstacle blocks by their bottom edge);
- overheads (health bars and ranged markers in one batch), ally attacks, hostile shots, telegraphs (lane telegraphs, ranged windups, boss ring warnings), and effects (player impact rings, particles, damage numbers);
- the player x-ray pass.

No body sprite can hide a threat, because shots and telegraphs draw above every body (V3). Particles and damage numbers draw above bodies so hits read on enemies. The x-ray pass redraws the hero half-transparent with its hit ring whenever at least 5% of the player's body box is covered by something drawn after it, or the player stands on a boss or large body (V4, BUG-12). The renderer exposes the last frame's `stats` (sorted bodies, player coverage, x-ray), which the diagnostics and the visual gate record. `test/layers.integration.test.mjs` checks the contract through a layer hook (`onLayer`).

## Animation states and motion (FX-01)

`src/game/render/animation.ts` gives every character one animation state in the renderer: what it is doing, when that began, which way it faces, and, for vector bodies, its heading. The renderer steps every character each frame from the render world. Off-screen characters step too, so one that walks into view is not taken for a new spawn.

- Hero: idle, run, cast, skillBurst (big actives and awakenings), hurt, rooted, silenced, death.
- Enemies: spawn (the first 0.25 s), idle, move, windup, attack (a dash, or 0.2 s after a shot), hurt, stunned, death (the FX-03 corpse effects).
- Bosses: intro (the first second), idle, move, windup, attack, phase (0.45 s), enrage (0.6 s), death.

Threats come first (V3): a windup or a dash keeps its pose through hits, phase changes, and entrances. Each state lists the atlas poses it may use, best first (`heroPoses`, `enemyPoses`). A state with its own baked animation plays it; until then it borrows the nearest pose (skillBurst uses the throw, stunned the hit, spawn the idle or walk cycle), so new art needs no code change. One-shot poses run in simulation time from the start of their state and hold their last frame. Loops cycle on simulation time with a per-id phase. Enemy sprites face their shield, their locked dash, or the way they walk. Vector bodies turn to their heading and never spin.

Detail follows the enemies on screen: full below 80, reduced from 80 (crowd animation at half rate), and minimal from 160 (a still frame). Reduced motion, from the option or the system setting, never lowers detail and keeps frame animation; it only drops shake, pulses, and spinning decorations (style bible §13). `stats.detail` reports the level of the last frame.

Enemy feedback (FX-03):

- A hit flashes a white cut-out of the enemy's sprite frame in three steps over 0.08 s. The cut-out is built once per frame with a source-in fill and cached. The hit's ink sprays out of the far side, because `enemy/hit` carries the direction the hit travelled, and the kit's comic hit star (`PN.vfx.hit`, four frames in 0.16 s) is drawn turned to the blow. Light hits skip the star at reduced effect density.
- A kill leaves a corpse in the presentation, with no gameplay id. For 0.25 s the body bursts: Ch1 roles play the kit's six-frame kill (`PN.vfx.kill`), baked as the enemy slot's `death` pose. Without one, the hit pose tips away from the player and fades.
- The stain then dries through the kit's decal stages (`PN.vfx.decal`): 3 s from ink.700 to ink.300, gone between 25 and 30 s. Vector chapters and bosses draw a plain ink stain on the same timing.
- Stains are capped at 48, or 24 at reduced effect density, and skipped at minimal detail (style bible P6).
- A new enemy rises out of an ink bloom during its 0.25 s spawn state. Hit and contact rules do not change meanwhile.

Damage numbers (FX-07) follow the kit's styles (`PN.vfx.damageNumber`):

- dealt: ink numerals with a paper outline;
- crit: paper numerals on a jagged ink tag, ending in "!";
- taken: coral numerals with an ink outline, starting with "−".

`src/game/render/numberGlyphs.ts` draws each style's characters once into an offscreen canvas, and numbers are stamped glyph by glyph instead of stroking text every frame. The face is the kit's bold condensed stack, taken from system fonts until an OFL face is bundled.

- A number pops for 0.12 s when it appears (not under reduced motion) and spreads sideways by its id.
- Under remaster rules, hits on one enemy within 0.3 s add into its number, which pops again over the enemy. Classic rules keep one number per hit, because their cosmetic ids feed gameplay ids.

Player feedback (FX-03):

- `player/hurt` carries where the hit came from, and a coral glow rises on that side of the screen for 0.35 s.
- The engine reports `player/lowHealth` when health crosses 30% either way. While it is low, the heartbeat sounds every 0.85 s, the screen edge glows coral, and the health bar turns coral and beats. The glow and the bar hold still under reduced motion or reduced flash, and reduced flash halves both glows.
- On `player/died` the simulation stops as before, and the app holds the settlement for 0.7 s. Meanwhile the hero falls back, the last hit's ink drifts at quarter speed for 0.4 s, and nothing can pause the run.

## UI screens and art (UI-01, UI-03, ART-09)

Each screen is a component in `src/ui/screens`, and `src/App.tsx` owns the state they share. Screens show kit art through the baked stylesheet `src/ui/art/uiArt.generated.css`: an element with class `artTile`, `artSlot`, `artPortrait`, or `artPickup` and a `data-art` key shows that cell, at any size (docs/art/pipeline.md). Draft cards read everything they print from the offer and the skill tables:
- the offer's `level` (the level before the pick) sets the level pips;
- `SKILL_LEVEL_STATS` gives the change rows, before and after the pick;
- the skill's `tags` give the chips.

The level copy on cards is generated from the same stat lines, so the rows and the copy cannot disagree.

The HUD (UI-02) reads only the HUD snapshot, which the engine emits every 0.12 s:
- `bossId` picks the boss portrait; `bossPhase` and `bossEnrage` / `bossEnrageSteps` fill the phase diamonds and the enrage state.
- `cooldowns` gives each active skill's remaining cooldown share. The engine infers a cooldown's length when it sees one start, so gameplay code needs no HUD bookkeeping.
- The portrait's expression comes from the snapshot too. The HUD picks, in this order:
  1. a wince for half a second after health drops;
  2. low health;
  3. focus while a boss is up;
  4. awakened once a skill has awakened;
  5. calm.

Onboarding hints (UI-09, `HintLayer.tsx`) never stop play. Each shows once per save, recorded in `profile.hintsSeen`, for six seconds above the boss bar. In 1-1 they show in this order:
- moving is all it takes, since attacks are automatic;
- after 8 s, ink shards level you up;
- once coins cover the cheapest upgrade, the pause hub sells upgrades.

At the first boss fight, a hint says to read the orange telegraph and step out.

The menu (UI-06, concept C) has the title, a vertical nav, and the hero's key art on the left. The nav holds 출정 (campaign), 무한 경쟁 (endless), 수련 (growth), 설정 (settings), and 도감 (the codex, not yet available). The wallet and the account level sit on the right, above the view the nav picks. The campaign view reads top to bottom:
- the chapter, with a landmark thumbnail and its progress per chapter, and chapter 6 to come;
- a path map of its ten stages: cleared stages carry the ink seal, the one to play next glows teal, and the boss stops show the boss's portrait;
- the selected stage: its goal and time, the chapter's four enemy roles, the least a clear pays, the best record, and the start button (Enter also starts it);
- the current stats.

`src/ui/menuStage.ts` works these out from the game's rules: the boss of a stage, the reward floor (`makeSettlement`'s terms with no kills or coins; `test/menu.integration.test.mjs` checks it against real settlements), the stage status from the unlocked frontier, and what the next level of each upgrade changes (`buildStats` before and after). The growth view shows that change and any lock reason on each upgrade.

Pausing opens the pause hub (UI-04, `PauseHub.tsx`), and the run stays stopped while it is open.
- Its tabs are the build, the run shop, the settings, and the controls; its actions are resume and abandon (with a confirmation).
- The run drawer is gone. Players buy upgrades and change settings in the hub, paused.
- A max-health upgrade bought there heals over `PAUSED_HEAL_SECONDS` after the run resumes, so pausing is not an instant heal (G6).
- The shop says that settlement gold counts the coins earned, not the coins left, so spending costs nothing at the settlement (SYS-09). The settlement labels that part 얻은 엽전 환산.
- Under the remaster rules (`patientPickups`, SYS-09), a pickup waits 60 s instead of 30 before it flies to the player by itself, and is banked at 75 s. Nothing is lost, but walking past the drops pays sooner than waiting.
- `SettingsPanel.tsx` is shared by the hub and the menu's settings tab.
- In developer builds, the cheat input lives in a small developer panel (`DevPanel.tsx`) that leaves the run going.

The settlement (UI-05, `SettlementModal.tsx`) shows the result first, then the numbers behind it, then where to go next:
- A clear shows the hero's victory portrait under an ink seal. A defeat shows the hurt portrait in an ink bleed.
- It lists survival time, kills, the highest level, and the damage taken. `settlementNotes` (`src/ui/settlementNotes.ts`) compares the run with the stage record saved before it and badges a new best kill count or clear time. Practice runs and first attempts get no badge.
- Gold counts up in 0.7 s (at once under reduced motion) and lists its parts. The engine's `goldParts` are the terms of the gold formula after the reward scale, so they add up to the gold before it is rounded down.
- Outer XP follows, with the account level it reaches and the passive points that brings. A first clear that opens a stage or a chapter says so, by the same rule that unlocks it (not in practice or developer access).
- Bars show each skill's share of the damage dealt, from the engine's `damageBySkill` tally. The tally counts only the health a hit actually took, and `damageTaken` counts the same way.
- Enter starts the next stage once the 0.8 s input guard has passed. A focused button keeps its own Enter.

Two HUD marks live on the canvas, because they need the camera (UI-02):
- Bosses and elites outside the view get a coral arrow on the screen edge. The arrow sits on the line from the screen centre toward the enemy and keeps clear of the HUD rows. Bosses come first; at most four arrows show.
- Silence and root show as round timers over the hero's head. The renderer infers each debuff's length when it sees one start, and the ring empties as the debuff runs out. The DOM effect rack still announces both to screen readers but no longer shows them.

## Strings (UI-10)

Every player-facing string lives in a locale file: `public/assets/content/strings/ko.json` (Korean, the reference) and `en.json` (English, a complete draft players cannot select yet). Code names a string by its key.
- `src/i18n/text.ts` types the keys: `StringKey` is the Korean table's keys, so code that names a key the table lacks does not compile. Template keys such as `` `skill.${id}.summary` `` are checked for every id.
- The engine and the content data never build a sentence. They hand the UI a `Text`: a key and its parameters, where a parameter may itself be a `Text`. Draft cards, objectives, and HUD effect labels are `Text`; boss, phase move, and effect names are keys. `src/game/skillNumbers.ts` fills the skill templates (`skill.<id>.awakening`, `skill.levelStats`) with the numbers the skills use, so BUG-16's rule holds in every language.
- The UI resolves text with `t(key, params)` and `tx(text)` (`src/i18n/strings.ts`). A missing key shows as itself. `formatCount` and `formatDate` format numbers and dates for the locale.
- `main.tsx` loads the table together with the app module and renders only when both are ready. Shipped builds load Korean. Developer builds can preview English with `?lang=en`. The boot failure screen and the render recovery screen keep their own Korean words, since the table may be what failed.
- Developer-only UI (the developer panel, cheats, the showcase pace) keeps its words in code: shipped builds drop it, and the production integrity check scans the tables too.
- Unit tests (`src/i18n/strings.test.ts`) are the missing-translation gate. Both tables must have the same keys, no empty strings, English without Korean, and the same placeholders per key. Every key must be used by code. No Korean may be left in code outside a short allowlist (the recovery screens, developer UI, and internal descriptors no screen shows).
- Terms follow the glossary (`docs/lore/glossary.md`): 계정 레벨 (was 외부 레벨), 금 (골드), 엽전 (코인), 런 (Run). English is used only in the logo and the small eyebrows.
- Boss titles and lines (FX-05) are still Korean-only data in `boss-titles.json`. They move into the tables once the lore bible's names are final.

## Content tables (TEC-05)

Content that is data, not code, lives in `src/content/data/`: one module per table, each with a single default export of plain JSON data, deep-frozen so no system can change it for the next run.
- The tables: `catalog` (base stats, skills, permanent and run upgrades, passives, the bosses), `skillNumbers`, `bossPhaseMoves`, `encounterGrammars`, and `soundCues`. The modules that used to hold them (`GameEngine.ts`, `skillNumbers.ts`, `bossPhases.ts`, `encounters.ts`, `audioPolicy.ts`) re-export them under their old names.
- Tests, tools, the headless engine bundles, and the dev server import the modules as they are.
- A Vite build (`vite.config.ts`, `contentTables`) evaluates `src/content/data/index.ts` the same way and emits it as `assets/content/tables.json`. It then swaps each data module for a read of that file (`src/content/tableRuntime.ts`). The runtime fetches the file once with a top-level await, so every game module sees its tables when it first runs. A failed fetch fails the app module, and the boot recovery screen shows (TEC-14).
- The bundle budget counts the file as data, not app JS.
- `src/game/contentTables.test.ts` checks that the index lists every module, and that every table survives JSON unchanged and is frozen. It also checks that the runtime read returns the same tables.
- New content tables (objectives, affixes, achievements, codex entries) go in this folder too.

## Hit-stop in two layers (FX-02)

- **Presentation layer:** a struck body recoils along the blow and eases back within 0.12 s: 2, 5, or 8 units for light, heavy, and critical hits. It holds its hit pose meanwhile (FX-01). Its simulated position does not move for it (G14). The `hitReaction` option (0-100%) scales the recoil. It is presentation only, so it cannot change a seeded outcome or an infinite record.
- **Global layer (`rareHitStop` rule):** a hit-stop of the whole simulation is kept for rare events only: the rail spear (0.045 s), a boss kill (0.09 s), and an awakening (0.06 s). These still spend the BUG-07 budget, and ordinary heavy and critical hits no longer ask for one, so a strong build does not make the game sticky.
- Classic rules keep 0.1.0's hit-stop on every heavy hit.

## Chapter environments (ART-05, ART-07, ART-08)

Under the `kitProps` rule, every chapter builds its map from the kit modules in its obstacle catalogue (`src/game/obstacleCatalogue.ts`):
- the chapter's block prop (walls, iron-rail partitions, canal embankments, clock plinths, toppled steles) in the same three footprints in every chapter, so obstacle geometry does not change with the chapter;
- three small props of the chapter as pillars;
- the post of the chapter's landmark stages.

The same two random draws that sized a block now pick its module, so hazards and positions do not move; only the footprints differ. An obstacle records its module in `art`. The renderer draws that module from the chapter pack on the footprint's centre, mirrored by id, and the module carries its own cast shadow. The ground is the pack's tile, stamped tile by tile over the visible world and turned by the tile's `angle` where the kit turns the chapter's slabs (Ch4); a repeating pattern fill of it stalled Chromium's canvas in frames with many small stamps (TEC-04). The kit's edge strip replaces the ink border. `obstacleCatalogue.test.ts` keeps the engine footprints equal to the baked ones. Classic rules keep random blocks on the grid.

Each chapter's art lives in its own atlas pack. Only the common pack and the pack of the chapter on screen are resident: the menu loads the selected chapter's pack ahead of its run and releases the others (`SpriteAtlas.release`), so textures stay within budget as chapters are added.

## Cover (SYS-06)

Under the `obstacleCover` rule, obstacles are cover for both sides:
- An ordinary enemy shot stops at the first obstacle it reaches before the player, with the same small ink burst as a friendly shot (`shot/blocked`).
- A shooter only starts to aim with a clear line to the player (`clearShot`, the check the player's auto-aim already uses). Without one it circles the player, closing a little, until a line opens. A shot already aimed still fires and can hit the wall.
- Boss barrages are airborne and fly over obstacles. The renderer draws each boss shot above the bodies, as before, and a ground shadow under them, offset down and to the right like every cast shadow, so a shot passing over a wall reads as passing over.
- Terrain acting on enemies is the team's A/B. It sits behind the `terrainOnEnemies` flag, off in both rule sets; the pilot is in docs/QUALITY_GATES.md. With the flag on, terrain acts on ordinary enemies at half strength (`TERRAIN_ENEMY_SCALE`):
  - fire burns them at half its damage per second;
  - water and slow zones slow them by half as much as they slow the player;
  - binding zones slow them to half speed rather than holding them, since enemies get no immunity to walk out on;
  - an enemy that walks onto a trap springs it, so the trap no longer waits for the player.

  Bosses are immune. A terrain kill counts as a kill, but the settlement's damage bars credit skills only. Tools switch the flag on with the probe's `patchRules` (`BALANCE_RULE_PATCH` for the pilots).

Classic rules keep 0.1.0's behaviour: every hostile shot passes through obstacles and shooters fire regardless of walls.

## Boss phase moves (SYS-04, SYS-05)

A campaign boss enters phase 2 at 66% health and phase 3 at 33%. Under the `bossMoves` rule each phase runs its move from `src/content/bossPhases.ts`. A move has an attack grammar, a movement mode, a cadence, and a telegraph. The telegraph's preview and imminent times are the warning, kept in real time whatever the cadence (V3). A move runs only once its grammar is built (`IMPLEMENTED_GRAMMARS`). Until then the boss keeps its base pattern and chases, and the HUD names only the moves that run.

- Ch1 (SYS-04). 잉크 도살자 has a tracked dash pair and a crossing dash triple. 종탑 간수 has an alternating ring gap and contracting ring walls.
- Ch2-5 final bosses (SYS-05), the ones with kit art:
  - 용광의 입. Furnace aisles: three fire lanes across the player light 0.3 s apart, and the aisles between them stay open. Ash vault collapse: a ring of fire with one gap falls around the player, the boss lands across from the gap, and the centre caves in 0.9 s later.
  - 걸쇠 여제. Chain lattice: a 3×3 lattice of bindings in two checkerboard waves. Execution cell: a square of bindings, then a smaller one 0.9 s later, both open on the same side. This is the Empress's own variant of the trap pattern she shares with 덫 설계자.
  - 톱니 전령. Gear orbit: two rings of saws orbit the boss in opposite directions while it circles the player. Guillotine gear: saws drop down the view in four of five lanes.
  - 공백 천칭. Balance of silence: two silence zones mirrored across the player. Blank collapse: a wall of shots closes on a blank void near the player and stops at its edge, while the boss waits outside. This is the Balance's own variant of the null pattern she shares with 무음 심판관.
- Movement: anchor holds near where the phase began, but only while the player is within 720, about the view's reach. A player farther away is followed, and the boss plants again where it stops. Once the stage clock runs out, enrage ends the hold, so an anchored boss can never be outwaited. Orbit and sweep circle the player at 300 and 380. Lattice walks one axis at a time. Warp moves land the boss where its warning ring stood.
- Every move leaves a way out (an aisle, a gap, a gate, an open lane, or the void itself) and warns for its whole preview. Scheduled terrain goes through `pendingHazards`, as delayed shots go through `pendingHostileShots`. Orbiting saws follow their boss and fall away when it dies.
- Still waiting for their kit art: the Ch2-5 mid bosses (유리 주교, 무채 조수왕, 시계 폭군, 일식 원장), whose moves are authored in data but not built, and the field bosses' light phase-2 moves.

## Stage objectives (CON-03)

A normal stage keeps its survival clock. Under the `stageObjectives` rule its objective (`OBJECTIVE_POOL`, rotating by stage and chapter) also changes the stage and sets a bonus goal. The numbers are in `src/content/data/objectives.ts`, and `src/game/stageObjective.ts` runs them. The engine asks it for the modifiers and reports kills, field bosses, and time in terrain to it.

| Objective | Changes | Bonus goal |
|---|---|---|
| 소형 무리 압박전 (swarm) | small share +15 points, spawns ×1.2 | defeat 280 small enemies |
| 중형 경계선 유지 (holdLine) | — | hold a marked zone for 30 s; it moves on every 10 s held |
| 지형 함정 구역 (traps) | twice the terrain | spend at most 20 s in hazards |
| 정예 추격전 (elites) | field bosses with ×1.5 health and ×1.2 damage | defeat both field bosses |
| 자원 회수 압박전 (salvage) | — | recover 5 ink caches, one after another, by standing on each for 1.5 s |
| 대형 개체 회피전 (giants) | large share +15 points | defeat 45 large enemies |
| 투사체 포위망 (crossfire) | three times the ranged cap, up to 6 | defeat 14 ranged enemies |
| 보스 전초 압박전 (vanguard) | a third field boss at 18% | defeat all three field bosses |

- Kill goals scale by chapter (×1, 1.6, 3.5, 4.5, 5.5): later chapters bring far more enemies.
- G9's stage exception: a moved share takes 15 points at most, and the other two tiers split the rest in their 58:30:12 proportion. Hit radii and tier stats never change. The ranged cap (1-3) is raised on the crossfire stages only. Field bosses keep their 36% and 72% marks, and the vanguard adds one (G8). The stage card lists every change (`menuStage.ts` `stageObjective`).
- The campaign's first stage teaches the game, so it keeps its bonus goal without the changes. Practice runs have no bonus goal: their clock is too short.
- The zone and the caches draw from the objective's own random stream, so the rest of the stage keeps its draws. The world renderer draws them on the ground in the player's colours: the zone as an ally ring, a cache as a reward ring round an ink packet. The solid arc fills as the player stands in it.
- The HUD shows the goal under the objective, counting, met, or missed. A goal met on a clear pays half the stage's floor gold (the settlement's 보너스 목표 part). It also stars the stage record (`profile.stageRecords[…].bonus`), and the stage map and card show the star.
- Landmark stages (St3, St7) open with the landmark's name card: the name and a line from the lore bible's draft table (§5.1), in `public/assets/content/landmark-titles.json`, like the boss titles.

## Assists (SYS-07)

The settings (menu and pause hub) have three assists: the share of damage the player takes (50-100%), enemy speed (80-100%), and a game speed of 80%.
- They live in the options (`assistDamage`, `assistEnemySpeed`, `assistSlowGame`), off by default. `GameEngine.assist()` applies them: hits and burns scale, enemies move slower, and the frame loop runs the simulation at 0.8 of real time.
- They change the simulation, so a run with any assist on, even for a moment, is an assisted run (`assistedRun`). An infinite run then stops counting for the board, as cheats do (G15). Turning the assist off again does not restore it.
- A campaign settlement reports `assisted`, and the stage record keeps an `assisted` mark that the menu shows next to the best record (G16).
- Tools that pass partial options get no assists.

## Difficulty curve (SYS-07)

The 0.1.0 curve was inverted: a new build hit a wall in Ch1, and a strong one found Ch5 harmless. Its flat defence (defence × 0.72 off every hit) turned most hits on a maxed build into the minimum 1. The `difficultyCurve` rule (remaster on, classic off) changes three things, with the numbers in `src/content/data/catalog.ts` (`difficulty`):
- Hybrid defence (`hybridHitDamage` in `p1Core.ts`): a hit loses a flat 0.35 of defence (0.2 for non-physical hits), then is scaled by 100 / (100 + defence × 4), never below 15% of itself or 1. A fresh build takes within 8% of the 0.1.0 damage; a maxed one keeps taking real hits.
- Enemy contact and shot damage rises 7% per chapter after the first.
- Boss stages scale their crowds by 0.85. Without the saturated defence, a tank no longer outlasts a boss stage's crowd for free; Ch3's mid boss stage went from 47% to 0% without it.
- Stage and chapter steps stay 0.2 and 0.45. The pilots that flattened them deepened the Ch3 valley instead.

## Build depth (SYS-08 experiment)

Builds converged on collecting every skill, and one fusion of two skills existed in practice. The `buildDepth` rule is an A/B experiment, off in both rule sets until the slot A/B playtests decide (`grammarContracts.test.ts` lists it with the SYS-06 terrain flag). Its numbers are in `src/content/data/buildDepth.ts`:
- A build holds 6 active and 4 passive skills. Once a kind is full, drafts offer no new skill of that kind, only level-ups of the ones held.
- An owned skill's draft weight is multiplied by `ownedWeight` (2), on top of its rarity weight (52/25/14/7/2) and the luck and stage biases (`drawSkillOffers`).
- Six fusion awakenings: 집행 바늘비 (needle storm + execution mark), 빙결 연쇄 (white chain + chalk cut), 공허 박격 (bone mortar + silent mine), 거울 레일 (black rail + mirror clone), 일식 흑점 (black sun + eclipse step), and 강철 부적 (iron frame + paper armour). Once both of a fusion's skills are awakened, its card takes the last place of every draft until it is picked. It adds to the two awakenings, and the first place stays the awakening card's (G3, G4). Each changes its skills with what they already draw: more needles that finish enemies left under 15%, slowing chain jumps, a void under each mortar shell, rails mirrored by both clones, a small black sun at each step, and a ward push that hits and stuns.
- Account levels 8 and 16 each unlock a token a stage. A token draws the open draft again (다시 뽑기, R) or banishes one skill card's skill for the rest of the run (제외), and another card takes its place. Both are engine commands (`draft/reroll`, `draft/banish`), so suspended runs replay them.
- Drafts opened together share one screen: it counts 연속 선택 n/m, and the opening sequence plays for the first only. A redraw keeps the screen as well.
- Level L needs the usual XP × `xpScale` × (1 + `xpGrowth` × (L − 1)), aimed at 20-28 drafts an 8-minute stage.
- Developer builds switch it on for the next runs with the cheat code `DEPTH`, for playtests; such runs are not suspended.
- `test/buildDepth.integration.test.mjs` covers the slots, the weight, where the fusion card goes, each fusion's effect, the tokens, the shared screen, the XP curve, and a run that spends tokens replaying exactly from its suspended log. QUALITY_GATES has the bot A/B.

## Run suspension (CON-04)

A run in play is kept in the save as a suspended run (`profile.runSuspend`), so a crash, a closed window, or a quit costs a few seconds at most.
- What is kept (`GameEngine.suspendState`): the seed, the meta and options the run started with, and every command that changed the simulation, stamped with the tick it took effect. That covers keys, the stick, the pointer, focus loss, draft choices, purchases (with whether the run was paused), and assist changes. Kills, coins earned, and time are kept for a settlement.
- The log is JSON. Each entry is `[tick, code, ...values]`: `a` key, `p` pointer, `s` stick, `r` focus loss, `d` draft, `g` redraw and `n` banish (SYS-08 tokens), `b` purchase, `x` assists. A step keeps only its last pointer and stick position, and repeated values are not logged. The input adapter sends the stick in 1/32 steps and the pointer on a 2-unit grid, so a held stick that jitters logs nothing. The engine keeps whatever it is sent exactly, apart from -0, which JSON cannot hold, so test drivers and bots play as before.
- A log over 36,000 entries (a 10-minute boss stage that changes its input every step) is not saved, which keeps the save well inside browser storage. The last save that fit stays.
- The app saves it every 10 s of play and whenever the run pauses, which includes focus loss. A settlement clears it.
- The menu offers it first. 이어하기 replays it in a new engine (`resumeRun`): the run starts again from its seed, and the commands are applied tick by tick, 1,800 ticks a slice, with no sound or UI meanwhile. It comes back paused in the pause hub, or in the draft it was saved in. A resumed infinite run is practice (G15).
- A suspended run from another rules version is not replayed. It is settled for what it reached, as a defeat (`suspendedRunReward`), and dropped (G14).
- Giving up in the pause hub settles the run as a defeat (`forfeit`), never better than dying would have been. It used to pay nothing (BUG-17).
- Time scale is a view setting, so a resumed run starts at 1x. A run where a developer cheat was used cannot be suspended.
- The desktop app flushes localStorage to disk every second, so a force-quit keeps the run saved at the last pause (docs/ELECTRON_HARDENING.md).
- `test/suspend.integration.test.mjs` plays 2,400 uneven frames with keys, the stick, the pointer, drafts, a paused purchase, and an assist change. It saves the run as JSON and replays it in a new engine. The state is identical at the saved tick and stays identical as both play on. The UI probe reloads the page mid-run and resumes to the same state. The Electron smoke resumes a run after a renderer crash, after a quit, and after a force-quit.

## Camera (FX-04)

The simulation camera stays hard-locked on the player, clamped to the world. Spawns, aim, and off-screen checks use it together with the logical frame (G14). Under the `smoothCamera` rule, the screen shows a separate view camera instead (`src/game/presentation/viewCamera.ts`):
- It follows the simulation camera on a critically damped spring (about 0.4 s to settle, no overshoot).
- It leans up to 70 units ahead of the player's movement. The spring's lag takes most of that back while the player moves at full speed.
- A hit kicks it along the blow, and it stays inside the world.
- It steps with the simulation, so a paused run holds still and replays draw the same frames.
- Pointer targets map through it, since that is what the player sees.
- Shake is a trauma² offset from smooth noise, so it draws nothing from a random stream.

Classic rules keep 0.1.0's hard lock and per-frame random jitter. Boss midpoint framing and the kill zoom punch are on the cut line.

## Event staging (FX-05)

- **Level-up:** the engine stops at the step the XP fills and opens the draft, so no simulated time passes (G15). The draft modal then plays a 0.6 s sequence: an ink ring bursts, the "레벨 업!" banner lands, and the cards turn in 80 ms apart. Reduced motion cuts every animation to nothing.
- **Draft sounds:** `draft/opened` plays the level-up sound, and a sting when a card is an awakening, legendary, or mythic.
- **Pickups:** `pickup/collected` fires only when a pickup reaches the player; a pickup that expires into the total stays silent. It plays a tick that rises one step per pickup within 0.6 s of the last, up to +48%, and leaves a four-fleck glint. Classic rules skip the glint, because their cosmetic draws feed gameplay ids. The coin chip pulses when the count changes.
- **Boss title card:** when a boss appears, the HUD shows its title card for 1.2 s, above the centre band, without stopping play. The card holds the boss's title, name, and one line, and a warning sound plays. The text is data (`public/assets/content/boss-titles.json`), copied from the lore bible's boss tables; `bossTitles.test.ts` keeps the two in step.

## Test access (TEC-07)

Tests, balance runners, and soak tools use `ProbedGameEngine` (`src/game/engine/probe.ts`), a test-only subclass whose `probe` API sets up worlds (spawn, place, patch, clear, halt spawns, set skills, cast), steps fixed ticks, observes every step (`onStep`), and reads a plain-data copy of the world (`read`). `createEngineHarness` (`src/game/engine/harness.ts`) implements the replay contract on the real engine: a seed plus a command log reproduces the same snapshot and fingerprint. The test bundle entry is `src/testing/engine.ts` (`npm run build:test-bundles`); the app entry never imports it, so production bundles do not ship the probe. Engine members are `protected` only so the probe subclass can reach them; nothing else subclasses the engine.

## Error handling (TEC-14)

`src/platform/errorReport.ts` keeps an in-memory `ErrorLog` of recent errors (source, message, stack, repeat count). `src/main.tsx` creates it and installs global `error` and `unhandledrejection` handlers before the game modules load. It then imports `App` dynamically, so a content check that throws while modules evaluate ends on a recovery screen instead of a blank window.

- Render errors: `src/ui/ErrorBoundary.tsx` catches them and shows a recovery screen (return to the menu, copy the log, reload). Returning remounts the app from its save.
- Frame errors: the engine's animation loop catches an exception in a frame, pauses the run, stops the loop, and reports through `EngineCallbacks.onFault`. The app shows a dialog. Retrying (`recoverFromFault`) restarts the loop paused, and the normal pause dialog resumes play. Leaving goes to the menu without the stage's rewards.
- Asset errors: a failed atlas pack falls back to silhouettes (TEC-03, TEC-10). The failure is logged, and a dismissible notice tells the player.

## Load-failure silhouettes (TEC-10)

Every character and prop has kit art, so the vector drawings that stood in during the rollout are gone from `GameRenderer`. What draws when a pack is missing, a slot is disabled, or classic rules place a random block is one high-contrast silhouette per owner:
- The hero is a paper disc in the ally rim on its hit circle, with an ink chevron toward the aim. A shield adds a dashed outer ring. The mirror clone is the same disc with a dashed rim, drawn faint.
- An enemy is its hit circle in ink with the hostile rim and a paper role glyph turned to its heading: a small wedge for the stalker, a long one for the charger, a barrel on a stock for the shooter, and a square for the warden. A hit inverts it to paper, so a strike still reads.
- An obstacle is a plain inked block with a lighter top face.
- Round bosses without kit art (the Ch2-5 mid bosses and the field bosses) keep their vector bodies until the kit draws them; so do projectiles, beams, hazards, and telegraphs.
- Other uncaught errors are logged and raise the same notice.

Copied reports replace the home folder in paths. Nothing is sent anywhere. In the desktop app, `electron/crashLog.cjs` appends the renderer's `[blackline:error]` console lines and renderer or child process exits to `logs/errors.log` in the app's data folder, rotating at 512 KiB. `crashReporter` keeps native crash dumps there with uploads off. A crashed renderer reloads to the menu, at most three times in five minutes. Developer builds add the cheats `FAULT` (the next frame throws) and `UIFAULT` (the next render throws) to exercise these paths.

## Save versions and the campaign shape (TEC-08)

`src/platform/save.ts` keeps one versioned envelope under one localStorage key, with the previous write as its backup:
- Version 3 adds the profile: stage records, and room for characters, codex, achievements, and a suspended run, so R3 systems need no further migration.
- A version 2 save migrates on load with its meta and options; the profile starts empty. New options take their defaults (G17).
- The key keeps its v2 name, so an older build reads version 3 as a future version, starts fresh, and never writes over it.

`src/platform/saveMigration.test.ts` checks both against ten saves that the 0.1.0 build wrote itself (`src/platform/fixtures/`): player journeys replayed through that build's save, settlement, and purchase code, and then that build's own loader after the move.

`src/content/campaign.ts` is the one place that says how many chapters and stages there are and which stages hold the bosses (`stageKind`). Content checks, the engine, save clamps, the replay contract, and the art registries derive from it.

## Desktop origin and saves (TEC-15)

The desktop app loads the game from `app://game/`, a custom scheme with a real, secure origin (`electron/appProtocol.cjs`), instead of `file://`. localStorage belongs to an origin, so the first app:// launch moves what a file:// build stored:
- `electron/saveMigration.cjs` reads every game entry (`blackline-survivor-*`: the save, its backup, the infinite boards) from the file:// origin.
- It writes them to a backup file in the app's data folder, copies each one the app:// origin lacks, and reads them back to check that every entry arrived intact (G17).
- A marker file then makes later launches skip the move. The game window loads only after this.

`src/platform/saveTransfer.ts` is the manual path, on the menu's 설정 > 세이브:
- 내보내기 copies every game entry as one text.
- 가져오기 checks a text first: it must be an export, hold a save that loads in this build, and not come from a newer build. It then replaces the game's entries and reloads.
- The migration's backup file is in the same format, so it can be pasted in too.

Details are in `docs/ELECTRON_HARDENING.md`.

## Migration strategy

The current `GameEngine` remains the behavior reference. Extraction proceeds in small, test-backed moves:

1. Pure math, lifecycle, content, and visual policy modules.
2. Shared engine contracts for commands, snapshots, events, and replay records.
3. Individual simulation systems with deterministic fixtures.
4. Renderer, input, audio, and React shell adapters.

Every move must preserve fixed-step equivalence, seed fingerprints, campaign invariants, and save compatibility.
