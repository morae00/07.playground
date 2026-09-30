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

## Input and commands (TEC-07)

`src/ui/inputAdapter.ts` owns the keyboard, pointer, and gamepad devices at the application level. It maps keys to the four movement actions (`ENGINE_ACTIONS`), pointer drags to world targets through `GameEngine.screenToWorld`, and the gamepad stick to analog movement, polling pads in `EngineCallbacks.onFrameStart`. The gamepad Start button is a UI event (`onPauseIntent`), not an engine command. The engine accepts input only through `GameEngine.dispatch(command)` with the commands in `src/game/engine/contracts.ts`; it registers no keyboard or pointer listeners. Draft cards carry an `offerId`, so `draft/select` commands can pick them from a log.

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

Pitch variation comes from the mixer, not the cosmetic stream, so sounds never move particles. Classic rules keep 0.1.0's per-hit draw on the cosmetic stream, because classic particle ids feed gameplay ids. `src/ui/uiSounds.ts` plays button clicks on the ui bus; a button can choose `data-sound="cancel"`, or `"none"` when its action already makes a game sound. A sound pack (`AudioMixer.loadPack`, Opus files per cue) replaces a cue's synth tone once it is decoded. Until the SFX library (AUD-02) delivers packs, every cue plays its synth tone.

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

Player feedback (FX-03):

- `player/hurt` carries where the hit came from, and a coral glow rises on that side of the screen for 0.35 s.
- The engine reports `player/lowHealth` when health crosses 30% either way. While it is low, the heartbeat sounds every 0.85 s, the screen edge glows coral, and the health bar turns coral and beats. The glow and the bar hold still under reduced motion or reduced flash, and reduced flash halves both glows.
- On `player/died` the simulation stops as before, and the app holds the settlement for 0.7 s. Meanwhile the hero falls back, the last hit's ink drifts at quarter speed for 0.4 s, and nothing can pause the run.

## Test access (TEC-07)

Tests, balance runners, and soak tools use `ProbedGameEngine` (`src/game/engine/probe.ts`), a test-only subclass whose `probe` API sets up worlds (spawn, place, patch, clear, halt spawns, set skills, cast), steps fixed ticks, observes every step (`onStep`), and reads a plain-data copy of the world (`read`). `createEngineHarness` (`src/game/engine/harness.ts`) implements the replay contract on the real engine: a seed plus a command log reproduces the same snapshot and fingerprint. The test bundle entry is `src/testing/engine.ts` (`npm run build:test-bundles`); the app entry never imports it, so production bundles do not ship the probe. Engine members are `protected` only so the probe subclass can reach them; nothing else subclasses the engine.

## Error handling (TEC-14)

`src/platform/errorReport.ts` keeps an in-memory `ErrorLog` of recent errors (source, message, stack, repeat count). `src/main.tsx` creates it and installs global `error` and `unhandledrejection` handlers before the game modules load. It then imports `App` dynamically, so a content check that throws while modules evaluate ends on a recovery screen instead of a blank window.

- Render errors: `src/ui/ErrorBoundary.tsx` catches them and shows a recovery screen (return to the menu, copy the log, reload). Returning remounts the app from its save.
- Frame errors: the engine's animation loop catches an exception in a frame, pauses the run, stops the loop, and reports through `EngineCallbacks.onFault`. The app shows a dialog. Retrying (`recoverFromFault`) restarts the loop paused, and the normal pause dialog resumes play. Leaving goes to the menu without the stage's rewards.
- Asset errors: a failed atlas pack falls back to vectors (TEC-03). The failure is logged, and a dismissible notice tells the player.
- Other uncaught errors are logged and raise the same notice.

Copied reports replace the home folder in paths. Nothing is sent anywhere. In the desktop app, `electron/crashLog.cjs` appends the renderer's `[blackline:error]` console lines and renderer or child process exits to `logs/errors.log` in the app's data folder, rotating at 512 KiB. `crashReporter` keeps native crash dumps there with uploads off. A crashed renderer reloads to the menu, at most three times in five minutes. Developer builds add the cheats `FAULT` (the next frame throws) and `UIFAULT` (the next render throws) to exercise these paths.

## Migration strategy

The current `GameEngine` remains the behavior reference. Extraction proceeds in small, test-backed moves:

1. Pure math, lifecycle, content, and visual policy modules.
2. Shared engine contracts for commands, snapshots, events, and replay records.
3. Individual simulation systems with deterministic fixtures.
4. Renderer, input, audio, and React shell adapters.

Every move must preserve fixed-step equivalence, seed fingerprints, campaign invariants, and save compatibility.
