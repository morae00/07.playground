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

Each arsenal weapon (SYS-15) plays its own cast, `cast.<weaponId>` (K10 Q7, notes in `art/audio/arsenal-casts.md`), so weapons that share a look still sound apart; a weapon without one falls back to its look's `cast.<look>`, and shake and the burst pose stay the look's. A weapon cast is held to its look's cast level within 1 LU by the cue gain (`npm run measure:loudness`).

A planted fuse bomber's fuse ticks toward its blast; if the bomber is felled first, the engine says `enemy/defused` and the presentation stops that fuse's voice (`SoundOutput.stop`), so no warning sounds for a blast that will not come.

AUD-03 is the music's playback, ready for the composer's tracks. It follows the cue sheet (`art/audio/cue-sheet.md`, a draft the team has yet to confirm) in three parts under `src/game/audio/`:
- `musicDirector.ts` decides, as a pure state machine with the cue sheet's numbers in `MUSIC_RULES`. The app gives it the scene (menu, run, story, settlement) and the overlays (pause, draft); the engine its events and snapshots. It answers with commands: play a track (fade or crossfade, resuming where the track stopped), stop it (keeping its place, or the defeat's tape stop), set a stem, duck, low-pass, sting, and decode ahead. A boss stage plays its boss track as the boss stands; field bosses and the infinite run's round bosses raise the chapter track's dense stem instead, as does a crowd over 55% of `HudSnapshot.enemyCap` for 2 s (off below 35% for 6 s).
- `musicPlayer.ts` plays them with Web Audio on the music bus, at `MUSIC_LEVEL` (0.12, a start until the mix is measured). A deck is a track's base and its stems, started together; the next deck crossfades in on equal-power steps and at most one deck fades at a time. Stems change at the next bar line (from the pack's tempo and meter, 7/8 bars included) over one bar. Ducks (the deepest wins) and the pause low-pass sit after the decks; the enrage sting goes past them and ducks the decks itself. A resumed track picks up at its 4-bar group, or from the top within 8 bars of its end. Only the tracks playing, fading, or asked for ahead stay decoded; one that fails to decode stays silent.
- `musicBridge.ts` maps the app state onto scenes and holds a run's first events until the app shows the run (a boss stage's boss stands from its first frame). A resumed run replays without events, so a boss stage also finds its standing boss, phase, and enrage in the snapshot.

The music code ships only in a build with `public/assets/packs/music/pack.json` (`__MUSIC_PACK__` in `vite.config.ts`, a dynamic import in the app): a build without the pack requests nothing and carries none of it, so the music bus stays silent. The pack lists each track's file, `bpm`, `meter`, `loop`, the sting's `cutAt`, and its stems (cue sheet §5.6); fields the player does not read are ignored.

## Render layers (TEC-12)

`WorldRenderer` draws the world in the fixed layer order `WORLD_LAYERS` (`src/game/render/worldRenderer.ts`):

- ground, hazards (the player's zones first, under the enemy's), ground marks (foot shadows, the player's foot ring, ranged-enemy rings, the chalk cut's chill and the rail's fissures), pickups, target guide, and obstacle shadows;
- bodies, depth-sorted by the y of their feet (enemies, bosses, the player, mirror clones, and obstacle blocks by their bottom edge);
- overheads (health bars and ranged markers in one batch), ally attacks (the player's impact and skill rings, beams, chains, blades, shots, and passive pops), hostile shots, telegraphs (lane telegraphs, ranged windups, boss ring warnings), and effects (hit stars, particles, damage numbers);
- the player x-ray pass.

No body sprite can hide a threat, because shots and telegraphs draw above every body (V3). Particles and damage numbers draw above bodies so hits read on enemies. The x-ray pass redraws the hero half-transparent with its hit ring whenever at least 5% of the player's body box is covered by something drawn after it, or the player stands on a boss or large body (V4, BUG-12). The renderer exposes the last frame's `stats` (sorted bodies, player coverage, x-ray), which the diagnostics and the visual gate record. `test/layers.integration.test.mjs` checks the contract through a layer hook (`onLayer`).

## Skill VFX (FX-06, FX-07)

The 17 skills draw from the kit (`PN.skillVfx`, `art/concept-kit/API-skills-vfx.md`):
- The bake puts its 188 stamps in a `skills` pack of their own (`assets/packs/skills/`, loaded with the common pack and kept), keyed `skill/<group>/<part>/<frame>`. The kit's shapes (`SPEC`), each part's playback rule (drive, rotation, layer, detail, still frame), and the timings in `art/atlas-spec.mjs` go into the atlas manifest as data (`manifest.skillVfx`), so their numbers stay out of the app JS.
- `src/game/render/skillVfx.ts` (`SkillVfxPainter`) blits the stamps (progress, loop, or index frames) and draws the shapes on the canvas: thread rings, stitched zone rims, the cyan halftone, vortex arms, the chalk cut and the black rail on the hit capsule (half-width = `width`), the white chain's bolt, the clone's thread, and the slash, ward, and pulse rings. Colours are token names resolved to the palette; cyan always rides on ink.
- The engine adds render-only data that replays never see: the skill on each player beam and chain, when the chalk cut's chill and root end on an enemy, the coin fever's rush, and `skillMark` rings the events do not size (the chain's burst, rail fissures, the mortar's aftershock, the eclipse slash, needle shards), handed straight to presentation. Presentation turns blasts, collapses, the magnet's pulse, coin pickups under the coin fever, and crits under the execution mark into the same `skillMarks`.
- Reduced motion holds loops on their still frame, stops the vortex arms and the bolt's flicker, keeps the pulse at radius 60, and puts the ward's plates in place; reduced flash dims the rail's flash; minimal detail drops decoration (dust, stitch heads, shards, bursts). Hit shapes never change.
- The developer cheat `VFX` awakens every skill at level 5 to see them all.

## Hazard art (K11)

The user asked that burning ground look like real fire and that a body standing in it visibly take damage (2026-10-15). The kit draws the seven enemy and map terrain kinds and the overlays on bodies in fire and in vines (`PN.hazards` 1.0-d2r2, `art/concept-kit/API-hazards.md`), the same mixed way as the skill VFX:
- The bake puts its 297 stamps (nine groups: the seven kinds, the hero, and enemies) in a `hazards` pack of their own (`assets/packs/hazards/`, one 2048x484 page), loaded with the skills pack and kept, keyed `hazard/<group>/<part>/<frame>`. The kit's shapes (`SPEC`), each part's playback rule and box, the states, and the C9 vectors (layouts of every kind, the shock cracks, and the null lines) go into the manifest as data (`manifest.hazards`).
- `src/game/render/hazardArt.ts` (`HazardPainter`) ports the kit's layouts and paths (API §8): the shared helpers (the best-candidate scatter with the fire's jit pool or the Kronecker pool `kron` and its mirror inset, the rim distances for rising and flat stamps, the per-hazard cap), the fire's clusters, rim ring, char, embers and smoke, the shock's cracks, pebbles, shards and dust, the slow's puddles by area (`mire-xl` at large radii) and bubbles, the water's surface strokes, ripples, flows and glint, the root's vines, the trap's machine, and the null zone's crumbs, ghost lines (clear of the centre, N1), and erase edge. Layouts are computed once per hazard id (and chapter) for every level of detail. `hazardArt.test.ts` checks the ports against the manifest's vectors; a scratch run of the kit in a VM compared some 29,000 more cases (radii past the game's, many seeds, every level) with no difference.
- Every terrain kind draws from the kit (`HAZARD_ART_KINDS` in `slots.ts`, switched on in the brief's order: fire, trap and null, shock, slow, root, water). The player's zones keep their skill art, and every kind keeps `GameRenderer.drawHazard` with its glyph while the pack is missing or failed (TEC-10); taking a kind out of the list rolls it back alone. Kit kinds draw with no glyph and no life fade; their end states say they are ending.
- Fire: ignite for its first 0.25 s, burn (map fires always), gutter for its last 0.5 s, and soot for 1.5 s after it is gone, which the renderer remembers by id, place, and radius (at most 12, 6, or 0 by detail) and draws on the decal layer. Visible fires draw in passes after the other kinds: every disc, char, heat band, and rim; then every flame of every fire by world y; then embers and smoke.
- Shock: while it counts down, the kit's cracks grow from the centre (amber cores, then warm glow once imminent, with pebbles at full detail) under the renderer's own telegraph rim, which keeps its preview arc, imminent ring and ticks (the user's choice) without the centre sign. The engine's `shock/burst` event carries the shock's id and radius, and the presentation layer keeps each burst for 1.45 s (`effects.shocks`, like the bombers' blasts; looks only): for 0.25 s under the bodies a coral fill, a halftone edge, the paper flash, lit cracks, and the core; then on the decal layer a faint crater and pale cracks fading over 1.2 s (none at minimal detail). Shards and dust fly for 0.3 s from the burst. Reduced flash halves the fill, the flash band, and the core.
- Slow: the renderer's own fill and hatch, the ink puddles and their bubbles (puddles and bubbles fade over the last 0.5 s), the amber rim; in chapter 4 the clock dial instead (ticks fill as the zone's time runs, a hand sweeps; tick by tick under reduced motion). Root: the same ground, the vines emerging for 0.25 s, swaying, and withering over the last 0.4 s, the amber rim, all at 0.35 with the vines still while the hero cannot be bound again (`rootImmunity`). Water: an ink wash, the surface strokes, ripples, flows and glint, the wet rim. Trap: the iron plate, groove, spokes and square rivets, the chapter's machine (chapter 5 uses chapter 1's), armed until sprung, the spring for 0.15 s, then shut at 0.7 and fading over its last 0.6 s. Null: the erased paper (`NEUTRAL.voidPaper`, also the vector fallback's fill) spreading from the centre with a jagged edge for 0.3 s, its dashed ghost lines and crumbs, redrawn over its last 0.5 s, and the dotted amber rim (the coral ring stays off, Q3).
- A screen holds at most 160, 90, or 40 terrain stamps by detail (SPEC caps). Fires take theirs first, at most 120, 40, or 20 (the kit's 72 at full detail was raised after the bench, docs/QUALITY_GATES.md): every fire keeps one body cluster, then the other bodies and char go to the fires nearest the hero, and the rim rings share what is left, thinned evenly in each fire. The other kinds share what the fires leave the same way by class: every hazard keeps its first item (a trap its machine, a binding zone a vine), then the main items (puddles, strokes, vines, crumbs) and the second ones (ripples, pebbles) nearest first, and the deco (bubbles, flows, the glint) shares the rest. Embers stop at 32 or 16, none at minimal detail.
- A hero in fire (`player.burn > 0`) stands in feet flames, `back` before the body and `front` after it, and while the fire hurts it (no shield) its cut-out multiplies coral over it (0.30 and 0.12 at 2 Hz, a steady 0.20 under reduced flash or motion), so the ink stays black and the scarf cyan, and embers rise off it. A hero a binding zone holds (`player.root > 0` inside a root zone; a trap's bind shows as its shut machine) is wrapped by vines, `bind-back` and `bind-front`, over 0.2 s and held, in every pose but a walk frame (BUG-15 keeps walk frames for real movement; a walk frame shown while bound goes without them). The x-ray pass redraws the tint at 0.6, the front flames, and the front vines. Sprite enemies in fire (`Entity.burn > 0`, never bosses) get feet flames only, the nearest 24, 12, or 0 by detail, with no coral on their bodies (V2). Without the pack, FX-03's coral bodies draw as before.
- Reduced motion holds loops on their phase frames (the water's strokes stay; flows, the glint, embers, and smoke go), cycles on their still frames, and plays the one-shot states. Reduced flash halves the ignite flash band and the shock's flashes. The screen-edge coral glow of FX-03 stays while the main session judges it from captures.
- Developer cheats: `FIRES` lays map fires of radius 60, 74, 86, and 98 round the hero; `FIRE` lays the two burning floors the visual gate captures; `TERRAIN` lays the other kinds round the hero in place of the field's own; `BIND` a binding zone at the hero's feet; `SHOCK` two shocks beside it (docs/DEVELOPER_APP.md).

## Animation states and motion (FX-01)

`src/game/render/animation.ts` gives every character one animation state in the renderer: what it is doing, when that began, which way it faces, and, for vector bodies, its heading. The renderer steps every character each frame from the render world. Off-screen characters step too, so one that walks into view is not taken for a new spawn.

- Hero: idle, run, cast, skillBurst (big actives and awakenings), hurt, rooted, silenced, death.
- Enemies: spawn (the first 0.25 s), idle, move, windup, attack (a dash, or 0.2 s after a shot), hurt, stunned, death (the FX-03 corpse effects).
- Bosses: intro (the first second), idle, move, windup, attack, phase (0.45 s), enrage (0.6 s), death.

Threats come first (V3): a windup or a dash keeps its pose through hits, phase changes, and entrances. Each state lists the atlas poses it may use, best first (`heroPoses`, `enemyPoses`). A state with its own baked animation plays it; until then it borrows the nearest pose (skillBurst uses the throw, stunned the hit, spawn the idle or walk cycle), so new art needs no code change. One-shot poses run in simulation time from the start of their state and hold their last frame. Loops cycle on simulation time with a per-id phase. Enemy sprites face their shield, their locked dash, or the way they walk. Vector bodies turn to their heading and never spin.

Detail follows the enemies on screen: full below 80, reduced from 80 (crowd animation at half rate), and minimal from 160 (a still frame). Reduced motion, from the option or the system setting, never lowers detail and keeps frame animation; it only drops shake, pulses, and spinning decorations (style bible §13). `stats.detail` reports the level of the last frame.

Reduced flash is a separate setting (UI-08, `motionPolicy` in `src/game/visualContracts.ts`). It dims what flashes and leaves motion alone: a struck enemy keeps its pose instead of the negative hit frame, and its white cut-out and the hurt and low-health glows draw at half strength. Either setting stops the screen shake and the heartbeat beat. In 0.1.0 reduced flash also stilled motion, so a v2 save with it on moves to v3 with reduced motion on too.

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
- A body standing in fire shows it (`player.burn`, `Entity.burn`, looks only): with the hazard art, the kit's feet flames and the hero's coral tint ("Hazard art" above); without it, a coral glow and embers. The fire's damage to the player shows as one small coral number every half second (`player/burn`; only under `isolatedCosmeticIds`, so classic ids stay put). Neither uses the hurt pose, vignette, or sound.
- The engine reports `player/lowHealth` when health crosses 30% either way. While it is low, the heartbeat sounds every 0.85 s, the screen edge glows coral, and the health bar turns coral and beats. The glow and the bar hold still under reduced motion or reduced flash, and reduced flash halves both glows (UI-08).
- On `player/died` the simulation stops as before, and the app holds the settlement for 0.7 s. Meanwhile the hero falls back, the last hit's ink drifts at quarter speed for 0.4 s, and nothing can pause the run.

## UI screens and art (UI-01, UI-03, ART-09)

Each screen is a component in `src/ui/screens`, and `src/App.tsx` owns the state they share. Screens show kit art through the baked stylesheet `src/ui/art/uiArt.generated.css`: an element with class `artTile`, `artSlot`, `artPortrait`, or `artPickup` and a `data-art` key shows that cell, at any size (docs/art/pipeline.md). Draft cards read everything they print from the offer and the skill tables:
- the offer's `level` (the level before the pick) sets the level pips;
- `SKILL_LEVEL_STATS` gives the change rows, before and after the pick;
- the skill's `tags` give the chips.

The level copy on cards is generated from the same stat lines, so the rows and the copy cannot disagree.

The HUD (UI-02) reads only the HUD snapshot, which the engine emits every 0.12 s:
- `bossId` picks the boss portrait; `bossPhase` and `bossEnrage` / `bossEnrageSteps` fill the phase diamonds and the enrage state, and `bossOvertime` counts enrage overtime (D-02).
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
- Bosses, large enemies, and elites (SYS-10) outside the view get a coral arrow on the screen edge. The arrow sits on the line from the screen centre toward the enemy and keeps clear of the HUD rows. Bosses come first; at most four arrows show.
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

Each chapter's art lives in its own atlas pack. Only the common pack and the pack of the chapter on screen are resident: the menu loads the selected chapter's pack ahead of its run and releases the others (`SpriteAtlas.release`), so textures stay within budget as chapters are added. An infinite run also loads the next chapter's pack 20 s before it turns to it (CON-08).

## Cover (SYS-06)

Under the `obstacleCover` rule, obstacles are cover for both sides:
- An ordinary enemy shot stops at the first obstacle it reaches before the player, with the same small ink burst as a friendly shot (`shot/blocked`).
- A shooter only starts to aim with a clear line to the player (`clearShot`, the check the player's auto-aim already uses). Without one it circles the player, closing a little, until a line opens. A shot already aimed still fires and can hit the wall.
- Boss barrages are airborne and fly over obstacles. The renderer draws each boss shot above the bodies, as before, and a ground shadow under them, offset down and to the right like every cast shadow, so a shot passing over a wall reads as passing over.
- Terrain acts on enemies under the `terrainOnEnemies` flag: on in the remaster rules since decision D-05 (2026-10-02), off in the classic ones; the A/B pilot is in docs/QUALITY_GATES.md. Terrain acts on ordinary enemies at half strength (`TERRAIN_ENEMY_SCALE`):
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
- Enrage: when a boss stage's clock runs out, enrage climbs a step every 30 s (`steppedEnrage`: speed ×1.2, pattern density ×1.3, damage ×1.5, then ×2.0). Under `enrageOvertime` (decision D-02, remaster on) it goes on after the fourth step: every 30 s the bosses deal 25% more damage and move 8% faster, so a fight that neither side ends still ends. The HUD shows the overtime count (`hud.enrage.overtime`).

## Stage objectives (CON-03)

A normal stage keeps its survival clock. Under the `stageObjectives` rule its objective (`OBJECTIVE_POOL`, rotating by stage and chapter) also changes the stage and sets a bonus goal. The numbers are in `src/content/data/objectives.ts`, and `src/game/stageObjective.ts` runs them. The engine asks it for the modifiers and reports kills, field bosses, and time in terrain to it.

| Objective | Changes | Bonus goal |
|---|---|---|
| 소형 무리 압박전 (swarm) | small share +15 points, spawns ×1.2 | defeat 280 small enemies |
| 중형 경계선 유지 (holdLine) | — | hold a marked zone for 30 s; it moves on every 10 s held |
| 지형 함정 구역 (traps) | twice the terrain | spend at most 20 s in hazards |
| 정예 추격전 (elites) | elites in every beat (SYS-10); without elites, field bosses with ×1.5 health and ×1.2 damage | defeat 10 elites; without elites, both field bosses, each within 60 s of arriving |
| 자원 회수 압박전 (salvage) | — | recover 5 ink caches, one after another, by standing on each for 1.5 s |
| 대형 개체 회피전 (giants) | large share +15 points | defeat 45 large enemies |
| 투사체 포위망 (crossfire) | three times the ranged cap, up to 6 | defeat 14 ranged enemies |
| 보스 전초 압박전 (vanguard) | a third field boss at 18% | defeat all three field bosses, each within 60 s of arriving (D-04) |

- Kill goals scale by chapter (×1, 1.6, 3.5, 4.5, 5.5): later chapters bring far more enemies.
- G9's stage exception: a moved share takes 15 points at most, and the other two tiers split the rest in their 58:30:12 proportion. Hit radii and tier stats never change. The ranged cap (1-3) is raised on the crossfire stages only. Field bosses keep their 36% and 72% marks, and the vanguard adds one (G8). The stage card lists every change (`menuStage.ts` `stageObjective`).
- The campaign's first stage teaches the game, so it keeps its bonus goal without the changes. Practice runs have no bonus goal: their clock is too short.
- The zone and the caches draw from the objective's own random stream, so the rest of the stage keeps its draws. The world renderer draws them on the ground in the player's colours: the zone as an ally ring, a cache as a reward ring round an ink packet. The solid arc fills as the player stands in it.
- The HUD shows the goal under the objective, counting, met, or missed. A goal met on a clear pays half the stage's floor gold (the settlement's 보너스 목표 part). It also stars the stage record (`profile.stageRecords[…].bonus`), and the stage map and card show the star.
- Landmark stages (St3, St7) open with the landmark's name card: the name and a line from the lore bible's draft table (§5.1), in `public/assets/content/landmark-titles.json`, like the boss titles.

## Elites (SYS-10)

The elite purple had nothing to mark, and the 정예 추격전 objective only strengthened field bosses. The `eliteAffixes` rule (remaster on, classic off) adds elites, with the numbers in `src/content/data/elites.ts`:
- An elite is an ordinary enemy of any tier with one affix. Its radius, tier, and role stay the tier's (G9, V4, V6). It has 2.5 times the health and pays 3 times the XP.
- 가속 (haste) moves 1.5 times as fast. 분열 (split) breaks into two enemies of the next tier down at half their usual health when it falls. 보호막 (shield) carries a barrier worth 60% of its max health that takes hits first and comes back after 4 s untouched. 흡수 오라 (drain) heals the enemies within 150 by 4% of their max health a second.
- Elite beats (SYS-03) promote 12% of their spawns. On the elite hunt objective (CON-03) 6% of every spawn comes as an elite, and its bonus goal becomes ten elite kills in every chapter; the field bosses keep their usual strength. At most three elites are alive at once. A fallen elite drops a coin chest worth 12 times its coins.
- The renderer outlines an elite in the elite purple (its sprite's cut-out nudged out, or a ring round a vector body) and marks its affix over its head. Its health bar shows unless health bars are off.

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

## Build depth (SYS-08)

Builds converged on collecting every skill, and one fusion of two skills existed in practice. The `buildDepth` rule began as an A/B experiment; decision D-09 (2026-10-02) adopted it with 6 + 4 slots, so it is on in the remaster rules and off in the classic ones. Its numbers are in `src/content/data/buildDepth.ts`:
- A build holds 6 active and 4 passive skills. Once a kind is full, drafts offer no new skill of that kind, only level-ups of the ones held.
- An owned skill's draft weight is multiplied by `ownedWeight` (2), on top of its rarity weight (52/25/14/7/2) and the luck and stage biases (`drawSkillOffers`).
- Six fusion awakenings: 집행 바늘비 (needle storm + execution mark), 빙결 연쇄 (white chain + chalk cut), 공허 박격 (bone mortar + silent mine), 거울 레일 (black rail + mirror clone), 일식 흑점 (black sun + eclipse step), and 강철 부적 (iron frame + paper armour). Once both of a fusion's skills are awakened, its card takes the last place of every draft until it is picked. It adds to the two awakenings, and the first place stays the awakening card's (G3, G4). Each changes its skills with what they already draw: more needles that finish enemies left under 15%, slowing chain jumps, a void under each mortar shell, rails mirrored by both clones, a small black sun at each step, and a ward push that hits and stuns.
- Account levels 8 and 16 each unlock a token a stage. A token draws the open draft again (다시 뽑기, R) or banishes one skill card's skill for the rest of the run (제외), and another card takes its place. Both are engine commands (`draft/reroll`, `draft/banish`), so suspended runs replay them.
- Drafts opened together share one screen: it counts 연속 선택 n/m, and the opening sequence plays for the first only. A redraw keeps the screen as well.
- Level L needs the usual XP × `xpScale` × (1 + `xpGrowth` × (L − 1)), aimed at 20-28 drafts an 8-minute stage.
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

## The meta layer: records, stars, codex, achievements, and the passive tree (CON-07)

The save had a clear count, the best kills, and the best time per stage, and nothing over all runs. CON-07 adds to the v3 profile, with defaults for older saves (G17):
- Each stage record (`StageRecord`) keeps its longest run (`bestSurvivalSeconds`, shown for stages not yet cleared), a clear with no damage (`noHit`), a clear with less damage than the hero's max health (`lowDamage`), and a boss stage cleared before its boss enraged (`swift`).
- A stage has three stars (`stageStars`): the clear, its second star, and the low-damage clear. A normal stage's second star is its bonus goal (CON-03); a boss stage's is the swift clear. Stage nodes show the stars, the stage detail names them, and the settlement shows the stars after the result, with how many it added (`settlementNotes`).
- Career totals (`profile.stats`): runs, clears, kills, bosses defeated, and simulated seconds played, over every run, campaign and infinite (`recordCareer`). A save from before them starts from what its stage records show.
- Settlements carry what these need: the stage kind, the hero's max health at the end, whether a boss enraged, and every boss defeated.
- The codex (menu 도감, `src/ui/screens/CodexView.tsx`) lists 66 entries, one to one with the illustration slots: 17 skills, 20 enemies (each chapter's four roles), 15 bosses, nine terrain kinds, and five chapters (`src/content/data/codex.ts`). A run reports what it found (`settlement.found`): the skills it held, the enemies and bosses it defeated, the terrain the hero stood in or cast, and the chapters it was played in. The app adds that to `profile.codex` (`recordCodex`).
- An entry not found yet is an ink silhouette that says how to find it. A found one shows its art, name, and lore line. The lines are draft data outside the app JS (`public/assets/content/codex.json`, and the boss titles), fetched when the codex opens. Skill pages add the skill's summary, so the codex doubles as the manual (UI-09).
- A codex saved before CON-07 (it has no chapter list) gets what its stage records show, once (G17): every chapter played, the four enemies of a chapter with kills, the boss of every boss stage cleared, and the needles.
- The terrain icons are the kit's hazard circles, baked like the other UI art (`art/ui-art-spec.mjs`, `terrain` sheet).
- Achievements (`src/content/data/achievements.ts`, `src/ui/achievements.ts`): 30 goals over the save: clears, chapters, the account level, stars, three-star stages, career totals, a no-hit clear, swift boss stages, the codex, and one endless run's length. They are worked out from the save alone, after every settlement and as a save loads, so an older save earns what it already did (G17). The menu says which were just met.
- Each achievement unlocks a cosmetic (`src/content/data/cosmetics.ts`): an outline round the hero, an ink trail, a portrait frame, or a title under the account level. A cosmetic not earned yet can be bought for its gold price, a sink for finished builds. Owned and worn cosmetics live in `profile.cosmetics`; only an owned one can be worn.
- The account passives are a tree of three branches with ten points each (`catalog.ts` `metaPassives`). A passive's first five points are its own effect (rare cards, boss damage, coins and magnet). Points six to ten grow its branch's second node: critical damage +0.02, critical chance +0.4%, and coin gain +3% a point. Account levels give a point each, so the tree fills at level 31. The values were cut until a maxed build with the whole tree stayed inside the R3 gate (QUALITY_GATES).
- Cosmetics are looks only. The engine passes the outline and trail to the renderer (`setCosmetics`); the simulation never reads them. Outline and trail colours are paper and ink tones, never the five signal colours (V2). The outline is the hero's cut-out in its colour, nudged out on four sides behind the sprite; the trail is a mark every 22 units of movement, fading over 0.9 s of play.

## Endless rotation and date seeds (CON-08)

The infinite run kept Ch1's look for good, had no field bosses, and had no daily challenge. The `infiniteRotation` rule (remaster on, classic off) adds them, with the numbers in `src/game/infiniteMode.ts` (`INFINITE_ROTATION`):
- The run turns through the five chapters. Once a chapter has lasted five minutes, the next round boss to fall turns the run to the next chapter (5 wraps to 1) before the next round boss comes. The engine keeps the chapter on screen (`shownChapter`) apart from the run's own chapter, which stays 1 for the infinite rules (`infiniteDifficultyAt`), so the climb does not change with the look.
- The map is not rebuilt. Blocks have the same footprints in every chapter, and pillars take the new chapter's footprint of the same module about their centres, so outline and hit box still agree. The ground, the obstacle art, the enemies and their kill sound, and the ambience follow the chapter on screen, and so do the codex finds (`<chapter>-<role>`, and every chapter turned to).
- Round bosses come from the chapter on screen. They are still random, never the same one twice running, and back 2.4 s after a kill (G16). 150 s into each chapter its field boss joins them, with 45% of a round boss's health and 87% of its damage at that minute, before the boss-kill pressure. It is not a round boss: the round bosses keep coming while it lives, its kill scores 900 (with the time multiplier) instead of the boss bounty and streak, and it does not add to the boss count. The boss bar keeps to the round boss.
- The HUD line names the chapter, and a turn shows the chapter's name card. The snapshot names the next chapter 20 s before its turn is due (`nextLookChapter`). The app loads that pack then and releases the one before after the turn, so at most two chapter packs are resident (about 75 MiB by the TEC-04 sizes, against the 96 MiB target).
- The endless menu offers today's seed and this week's seed (`dailySeed`, `weeklySeed`): FNV-1a hashes of the local calendar day and of its ISO week. Every player gets the same run on the same day without a server. The board marks records played on them.
- `test/rotation.integration.test.mjs` covers the turn, the pillars, the rosters, the field boss, the classic run, and the codex. It pins the date seeds for 2026-10-01 and replays a scripted daily run in another window and with other options to the same state (G14).
- The result copy already names the rules version (`rulesLabel`). No build has shipped the remaster rules yet, so CON-08 stays under RULES_VERSION 2 (`src/game/rules.ts`), and the v1 records stay apart as legacy.

## Boss toughness (SYS-12)

Bosses fell in seconds: a maxed build killed the infinite run's round bosses in a median 2.8-3.7 s between minutes 5 and 20. The `bossToughness` rule (remaster on, classic off; user request 2026-10-12) makes them fights, with the numbers in `src/content/data/bossToughness.ts`:
- Boss stage bosses take their chapter's factor: 1.6 times the health and 1.2 times the damage in Ch1, 1.8 and 1.35 in Ch2, 2 and 1.5 from Ch3. Field bosses on normal stages take 2 and 1.15. With the horde fixed, 1.6 and 1.2 everywhere left boss stages easier than at the R4 baseline, and 2 and 1.5 everywhere stopped the Ch1 final boss stage (the novice cleared 1-10 in 1 of 20 runs, 4 of 20 with Ch1 at 1.6 and 1.2; 10 of 20 before R5).
- An infinite boss takes a factor by the minute it arrives (1 at the start, 1.5 by minute 25; field bosses 1.2) and deals 1.15 times the damage. Its health is also at least 25 s (field bosses 15 s) of the pace the player felled the last bosses at (each fight's health per second, blended half and half). A strong build meets real fights, a weaker one only the minute factor, and the run's first boss has no pace yet. The pace is measured from the run, so replays stay exact.
- A boss pays its health over its untoughened health in XP and coins, up to three times. Without that, slower boss kills starved the run of levels, and a mid build died to the crowd by minute 8.
- Measured with the striker bot, three seeds, 25 minutes: maxed round bosses fall in a median 18-25 s in every five-minute span and all three runs reach minute 24; mid builds (half the upgrades) take 21-31 s and one of three runs reaches minute 24 (before: all three past minute 22). Maxed boss stage bosses take 66-145 s instead of 51-114 s, and boss stage clears barely move. `scripts/lib/full-balance-runner.mjs` reports `bossKillSeconds` for boss stages.

## The horde (SYS-13)

The user asked for far more monsters (2026-10-12). The `horde` rule (remaster on, classic off) has its numbers in `src/content/data/horde.ts`:
- The field holds 1.9 times the enemies (the infinite run at most 400) and they come 1.9 times as fast. Each ordinary enemy has half the health. Its contact and shots deal 0.6 of what gets through the player's defence (`damagePlayer`), so twice the bodies do not mean twice the hits. It pays 0.4 of the XP and 0.35 of the coins; the fractions carry from kill to kill (`hordeReward`), so the averages are exact. Bosses and bomber blasts are untouched.
- The infinite run has its own shares (`hordeShare`): hits 0.35, XP and coins 0.55, since its enemies grow stronger by the minute.
- Why after defence, and why rewards below 1 / 1.9: the first full balance run with the horde (2026-10-12) cleared 40% instead of 29%, and the later chapters most. Cut before defence, a hit fell to the damage floor once the personas' defence grew (7% of hits at the minimum against 0.06%), and a crowd that dies faster than it comes paid 1.5-2 times the XP and 2-3 times the coins per minute (stages ended 5 levels higher). docs/QUALITY_GATES.md has the R5 runs.
- A strong build clears the infinite field as fast as it fills. After the first minute, while the field holds under 35% of its cap, each ordinary kill adds one spawn, so the field refills as fast as it is cleared and a slow build meets no more than before. A spawn-rate boost by how empty the field was overwhelmed mid builds by minute 2 and was dropped.
- Measured with the striker bot (Ch4 St7 and the infinite run): campaign fields peak near 190 instead of 95; a maxed infinite run keeps 85-105 enemies on the field instead of 11-36 and fells about 47,000 instead of 5,400 in 20 minutes. Mid builds survive as long as with boss toughness alone (before the after-defence change; see the R5 runs).
- The release performance gate's stress scene has 400 enemies now (docs/QUALITY_GATES.md).

## Bombers (SYS-14)

The user asked for self-destructing monsters from a certain level, more of them later and over time, whose dodging decides clears without erasing the other roles (2026-10-12). The `bombers` rule (remaster on, classic off) has its numbers in `src/content/data/bombers.ts`:
- Some small contact spawns come as bombers: from Ch1 St4 (4% of spawns, 10% at Ch2 St10, 18% at Ch5 St10) and from the infinite run's second minute (4%, 10% at minute 10, 20% at minute 25), with at most 4-18 (campaign) or 4-28 (infinite) alive. 70% are fuses.
- A fuse bomber that touches the player plants itself: it stops, and an amber circle of its 100-unit reach fills from the centre over 1.15 s (the rim thickens for the last third); then everything inside is hit. Stepping out dodges it; killing it first defuses it. A burst bomber is faster and goes off the moment it touches, over 60 units. Unplanted bombers wear marks that read from afar: the fuse an amber dashed ring and a lit spark, the burst a throbbing doubled hostile ring (steady under reduced motion).
- A blast deals 5 (fuse) or 3 (burst) times a small enemy's contact damage there as a non-physical hit, and pays no XP or coins (`enemy/blast`, no kill). Bombers have 2.5 (fuse) or 1.6 (burst) times a small enemy's health, more on later stages and minutes, and in the infinite run at least half a second of the pace the player fells bosses at (SYS-12), so a strong build cannot melt them all at the screen edge.
- Sounds: `bomber.fuse` (a hiss ticking faster) and `bomber.blast`, appended to the SFX recipes. The blast flashes its reach as a hostile ring and shakes the screen, harder when it caught the player.
- Striker bot, 25 minutes of the infinite run: maxed runs take 9-25 blasts and two of three reach minute 24; mid builds last 8.5-18.3 minutes (one died to a blast). The kit draws both bombers (K7, `art/concept-kit/k-bombers.js`): 18 frames a chapter in the chapter packs (`enemy/<ch>/bomber-<kind>`), a planted fuse's plant frame picked by the fuse's progress at every level of detail, the spark on the wick tip (the bake carries the wick table in the manifest), and the blast drawing for 0.15 s on the floor layer. A pack without them draws the chapter's stalker with the marks. The developer cheat `BOMB` puts two of each around the player.

## Arsenal FX (K10, FX-08)

The user asked that weapons of one look stop looking alike (2026-10-15). The kit draws the field effects of the 22 weapons that fire no projectile (strike, nova, lob landing, chain, beam, and halo, plain and awakened), the four lobs in flight, and the awakening gimmicks, P1 and P2 (`PN.arsenalFx` 1.0-d3b2-r1, `art/concept-kit/API-arsenal-fx.md` §14, brief `docs/art/briefs/arsenal-fx.md` §4), the same mixed way as the skill VFX and the hazards:
- The bake puts the stamps of every weapon the kit has drawn (its `META.done`: field effect or gimmick; 39 groups, 354 stamps) in an `arsenal-fx` pack of their own (`assets/packs/arsenal-fx/`, one 2048x820 page), loaded with the skills pack and kept, keyed `afx/<group>/<part>/<frame>`. The kit's shapes (`SPEC`, with the gimmicks' `zone`, `gimmick`, and `overlay`), the drawn weapons' numbers (`META` without its names), each part's rule, and the C9 vectors the bake takes from the kit's own `layout`, `paths`, and `lobPath` (87 cases, the P1 and P2 gimmicks' among them) go into the manifest as data (`manifest.arsenalFx`).
- `src/game/render/arsenalFx.ts` (`ArsenalFxPainter`) ports the kit's shapes and placements (API §7-§8): the blast rings (stroke with its punch, band with its knots, end taper, fringe and dab core, ripple, multi, and the flickering jag), the ink splash that grows with R, the scroll's tilt and the seal print's mirror, the chain lines (sag, twist, links), the beam lines (blade, brush band, string, and the hit capsule from `footClear`), the halos (wash, crescent, comet, rope), the stamps' layout (with the gimmicks' disc, outward ring, corner, centroid, unroll tip, and eclipse ribbon), the spin's arcs, the scroll's ridge, the lob path, and the P2 shapes (API §14.11: the event rings' torn band, dashed sandwich, and open jags between gaps, the crack burst's paper lines, the leap's kink, the branch lance). `arsenalFx.test.ts` checks the ports against the manifest's vectors, so a rebake of a changed kit retests them.
- What it draws from: a weapon's own `area/blast` and halo sweep reach presentation as `skillMarks` that last as long as the kit's art for them (`SPEC.life`, ring then decal, through the host's `markSeconds`) and carry a cosmetic serial, the seed of their jitter (the presentation's own counter, never a game id, BUG-08). Beams and chains take a serial the renderer keeps per effect. Lobs in the air are `RenderWorld.lobs` (`ArsenalLob`: where and when each was thrown, its flight time, its place in the cast, and its awakening, looks only); the blast that ends a lob carries the way it flew (`dir`), and a meteor brush that came from the right lands mirrored (`SPEC.flight.landMirror`, review 4). Chain points carry the radius of the enemy reached, for the size of the frost chain's ice. All of these fields are drawing only; the simulation reads none of them.
- Layers: decals (brush marks, seal prints, the pots' splat and pool, the meteor crater) on the ground layer after the corpse stains, newest first, 16, 8, or 0 by detail; the frost chain's ice (the chain's life plus 0.3 s, at most 24, 16, or 8) and the lobs' shadows with the ground marks; and in the ally attacks every splash (12, 8, or 3 blasts), every ring, band, and halo (a cast's seal washes as one path), the objects by their blast's y (the clap and the bell over the hero, raised past its debuff timers), the beams and chains, and the lobs in the air (12, 12, or 6), under enemy shots and telegraphs.
- Detail and settings: reduced detail halves loop rates and every other decoration, minimal drops decoration, decals, and splash drops, keeps three splash spikes, holds loops, and draws a frost chain as one bent line (also past 120 or 60 chain links a screen); a screen draws at most 220, 140, or 70 stamps, decoration first to go (SPEC caps). Reduced motion brings rings in at R by alpha with the punch at most 1.5, holds loops and comets and crescents, fixes the jag's and twist's flicker, and keeps the progress parts playing (the ink pot's one roll over its flight); reduced flash halves the meteor brush's impact. Hit shapes never change.
- The awakening gimmicks, P1 (delivery 3a, API §14, review 5 §6):
  - Ground zones (`RenderWorld.zones`: the spin, caltrops, smoke, graves, the lightning pillar, ink pots fire, the tar's gathering, the meteor's mark) take their radius and life from the data and a serial the renderer keeps per zone. First in the hazards layer: the meteor's crater floor, the wash, and the tar's gloss at the zone's alpha (in over 0.15 s, out over 0.3 s), the rim for the whole life (the sewn ally dashes; the meteor's mark solid, heavier with the hero inside), and the ground stamps. Graves and pillars stand among the bodies by their foot y (so the x-ray pass sees them); the spin's blades and arcs and the meteor's motes go over the bodies. The centre object's start and end parts (the grave rising, the pillar striking and breaking, the blades falling) play at alpha 1 inside the life, and its own frames fade only on a side with no such part (review 5 F2). A meteor landing on its own mark draws no second crater.
  - Enemy overlays (`Entity.awk`, API §14.5, §14.10): one feet overlay an enemy, the first of `priority.feet` it has: a freeze (the frozen state is `awk.freeze`; it replaces the chalk cut's root ring, and the frozen body holds its idle frame, dark under the white crystals, in place of the stun's hit frame), a grave's bind (`awk.bound`, looks only), burning ink on those standing in an ink pots fire (the renderer computes who by the fire's hit rule; `enemy.burn` stays off), frost 2 or 1 (`awk.frost` within its window), or thorns; the freeze's back under the body, everything else right after it. One head mark an enemy, the first of `priority.heads` it wears, where the vector signs sat (past the bar, elite mark, and stun): silence, prey, fear (its drop mirrored with the enemy's facing), the wander's curl (decoration: at minimal detail the next mark shows), weakness, a stain by its count. A boss wears its crack plate by its count apart from the caps, beside a head mark (x + 26); the pollen's two spores rise over its carriers; the crow circles apart and dives at each peck (`awk.peckAt`). Each enemy's overlays run on a clock offset by its renderer serial so a crowd's crows and tags do not move in step. With every mark's art in, the vector signs are not drawn.
  - Events and lines: the tracking seals' three beams draw as one triangle (width 2 sewn pending, width 8 striking); the falling scroll's echo beam unrolls as a paper band at its hit width in place of the ink bar; the seventh seal's eighth waits as `RenderWorld.pending` (its centre, the seven seals, 0.3 s: a growing shadow on the ground and stitches from the seals), then its echo blast draws the big print (a decal), the wash, the heavy ring, and the big seal; the brush downpour's growing blasts already draw at their own radius; the eclipse's heavy sweep is the total eclipse, its disc and band on the ground layer under the bodies (halved under reduced flash, review 5 ②) and its rim, line, corona, and ribbon over them. Presentation keeps the eighth seal through its print (1.2 s) and the eclipse for its sweep (the host's `markSeconds` with `echo` and `heavy`).
  - Caps (SPEC `caps`, nearest the hero first): heads and feet 24, 16, or 8 (a freeze is never dropped), crows 12, 8, or 4, pecks 16, 10, or 4 (none at minimal), zone stamps 120, 72, or 36 (centre objects never dropped), pending marks 12. Reduced detail halves loop rates and every other zone decoration, corona flag, and stitch; minimal keeps each zone's centre object, floor, fill, and rim. Reduced motion stills the spin's arcs, sits the crow, holds loops and cycles, sews the triangle and unrolls the scroll at once, and brings the eighth's ring in at R; reduced flash halves the big seal.
- The awakening gimmicks, P2 (delivery 3b, API §14.10-§14.11, reviews 7 and 8):
  - Event rings and bursts, drawn from what the engine already sends: the echo blasts of a stain's and a crack's burst (the crack's paper lines first), a quill's late dab, the clap's echo, and a cluster pot's split (a plain cluster pot ring and burst at its own radius), and the gimmick rings the engine now marks as echoes (the fear, the pollen every tick, the rear hit). Each ring's centre line lies on the event's radius once grown, broken by its gaps, cyan only on its core (the pollen's dashes a same-phase sandwich round the whole ring); the bursts are their events' centre objects. Presentation keeps each for the gimmick's own life (`markSeconds` with `echo`).
  - Moments and pending (`RenderWorld.pending`, looks only): a quill's dab waits on the ground where it first struck (first in the hazards layer, by its wait); a split's two small pots fly the mini lob path to where they burst over their shadows; a seal arrow's topple where the two bodies meet, an ink pulse's bump on the side the pulse drove the body to, and a caltrop's snap show 0.2 s (deco, `caps.events`).
  - Lines and shots: a thunder needle's leap kinks between the two bodies; the spark thread's rewind runs back along the whole thread (`ChainEffect.thread`, looks only) with a spark on each enemy it reaches; an awakened storm thread's cast (`ChainEffect.gimmick`) widens jump by jump; the frost chainlet's links are drawn from `awk.link` for its two seconds, whole for 0.18 s after a shared hit (`awk.link.sharedAt`, looks only; the engine's flash chain is not drawn); a lance's branches thrust from its tip once it has thrust, the fork drawn once; the wide brush's sweep back runs from the far end at × 0.65, the brush mirrored; an enemy shot the ink orbit turned back is a paper comet along its velocity; an awakened sun needle's stamps grow with its radius (at most 1.6). The meteor's mark puts the haste at the hero's feet, right after its body.
  - Caps: event decoration 16, 10, or 4 a screen (none at minimal), pollen rings 8, 4, or 0, spores 16, 8, or 0, links 120, 60, or 0 (past them a link is one bent line); the rings, bursts, crack lines, leaps, branches, sweep backs, dabs, and turned shots are always drawn. Without the pack, every weapon and gimmick draws as before (TEC-10).
- Developer cheats: `AFX1` casts the bone mortar's six look-alikes in turn, `AFX2` the chain spark's five, `AFX3` throws the four lobs (a meteor brush leftward) beside a coin, jades, and a bone mortar shell, and `AFX4` awakens six weapons, one of each kind, over two hundred enemies; `AFX5` to `AFX10` stage the P1 gimmicks and `AFX11` to `AFX16` the P2 ones (docs/DEVELOPER_APP.md).

## The arsenal (SYS-15)

The user asked for five times the weapons (2026-10-12). The `arsenal` rule (remaster on, classic off) adds 44 weapons to the 11 active skills, 55 in all. Each is a row of data in `src/content/data/arsenal.ts`, generated with its names from one spec, and `GameEngine.fireArsenal` fires every row the same way:
- Eleven kinds: volley (shots at the nearest enemy), burst (all around), spray (a wobbling stream), rear (behind the way the player moves), seeker (one shot at each of the nearest different enemies, or the boss first), strike (blows from above on enemies in range), nova (a blast around the player), lob (a blast where the target stood, after a delay), chain (hops between enemies), beam (an instant line, one way or four), and halo (a sweep of a band around the player).
- Effects on every hit, in `dealDamage`: slow, stun, knockback, execution of an ordinary enemy left low, extra crit chance, and boss damage. Bosses shrug off slows and stuns.
- The weapons are skills: `SkillId` is the 17 skills of 0.1.0 (`CoreSkillId`) and the arsenal's ids (`ArsenalId`). The catalog lists them as active skills, so drafts, slots, levels, awakenings, the HUD, the pause hub, and the settlement take them as they are. Cards print their damage and the number their kind grows by (`src/game/arsenal.ts`), and an awakening adds 35% damage, one more of its count, and 20% reach. Classic drafts never offer them.
- Art: the kit draws the weapons in three deliveries (K9, `art/concept-kit/k-icons2.js`, `PN.arsenal`). A drawn weapon (its `done` flag, listed in `art/ui-art-spec.mjs` `ARSENAL_ART`) has its own plain and awakened tile and HUD slot, in keyed sheets of their own (`arsenal-tiles`, `arsenal-slots`: each key names its image, so a sheet loads only where one of its cells shows, and the build puts keyed sheets under `assets/packs/ui/`, outside the initial download), and its own shot stamps in the skills pack (`skill/<weapon>/<part>/<frame>`), which the renderer prefers over its look's. Until then a weapon fires with its look (an active skill's art: shots, rings, beams, chains) and wears its look's tile with a two-syllable badge (`scripts/build-arsenal-art.mjs` writes `src/ui/art/arsenalArt.generated.css` for the undrawn ones). A projectile carries its weapon's id for hits and its look for the art. Weapons without shots draw their field effects from K10 ("Arsenal FX" below), or their look's while its pack is missing.
- Awakening gimmicks (SYS-16, `awakeningGimmicks` rule, remaster on): on top of the common boost, every awakened weapon has one gimmick of its own, no two alike (the user asked 2026-10-15 for special awakenings without repeating one idea across weapons; the push is the ink pulse's alone). The numbers are `src/content/data/awakenings.ts`, the design `docs/decisions/SYS-16-awakening-gimmicks.md`. `fireArsenal` handles the ones that change how a weapon fires, `afterHit` the ones a hit sets off, `shotEnded` the ones at a shot's end, and `lobLanded` the lobs'. Damage a gimmick deals itself (`echoing`, and shots spawned with `echo`) runs no gimmick and no weapon effect, so nothing chains on. Ground they leave is `RenderWorld.zones`; what they leave on an enemy is `Entity.awk` (stains, cracks, pollen, thorns, crows, prey, and the silence, fear, and wander that stop an enemy starting a shot, dash, or fuse). Bosses take the damage gimmicks but never a stun, root, fear, wander, pull, push, or silence. The awakening card adds `skill.<id>.awakeningGimmick` after the common line.
- Balance bots count every non-passive skill as active, so they take arsenal weapons when their favourites are not offered.

## Characters (CON-10)

The user asked for characters with their own starting weapons, not one for every weapon, whose upgrades raise the starting weapon's level (2026-10-12; this replaces D-13's single character for 1.0). The `characters` rule (remaster on, classic off) has its numbers in `src/content/data/characters.ts`:
- Eight characters, each starting with a different weapon (three of the 0.1.0 skills, five arsenal weapons) and a perk: attack, attack speed, crit chance, move speed, max health, defence, boss damage, or regen. 결 is free; three unlock with gold and four when a chapter's tenth stage is cleared (developer access opens all).
- Upgrades (5, for 400 to 6,000 gold) start the weapon at Lv.1, 2, 2, 3, 3, 4 and add a perk step each (`src/game/characters.ts`); the perk applies to the account's stats before the run's skills (`buildStats`).
- The menu's 캐릭터 tab (`src/ui/screens/CharactersView.tsx`) selects, unlocks, and upgrades. The save keeps the selection, the unlocked list, and each level (`profile.characters.levels`). The run starts as the selected character (`GameEngine.setCharacter`), and a suspended run keeps its character so it replays exactly. Without a character the engine starts as 0.1.0 did, with the needle storm at Lv.1.
- Art: the kit draws the seven others (K8, `art/concept-kit/k-characters.js`, `PN.characters`) on Gyeol's rig: idle, run, throw, and hurt (21 frames each, death borrows hurt) and six portraits. Each has a pack of its own (`hero-<id>` under `assets/packs/`, brief Q6), which the app loads with the common pack for the character on screen (the menu's selection, or a run's own) and releases for the rest; until it is in, the renderer draws Gyeol (`characterSlot`, `RenderWorld.character`). The HUD, the settlement, and the menu cards show the character's portraits (`portraitArt`; a keyed sheet of their own, `character-portraits`, outside the initial download), and a card not yet open shows an ink silhouette. A mirror clone of another character is its own faint sprite; Gyeol's keeps the kit's line clone.

## Story beats (CON-06)

The campaign had no story on screen: clearing 5-10 showed a banner and nothing else. CON-06 adds the lore bible's drafts (docs/lore §7) as story beats, all skippable, none over play (G15):
- The prologue (four panels) plays before the first run of the campaign; it ends on Ch1's name and the hero's first line, so it is Ch1's intro. Ch2-5 each have an intro panel before their first run. Each chapter has an outro panel after its final stage's first clear, before the settlement, and 5-10 follows its outro with the ending (seven panels, the last one looking ahead to the next chapter, 6장 준비 중). Practice clears play none.
- `src/ui/story.ts` decides which beats are due (`beatsBeforeRun`, `beatsAfterClear`); `src/ui/screens/StoryPanels.tsx` plays them in a dialog. Enter, Space, →, a click, or A goes on; Esc, B, or 건너뛰기 skips the rest. The dialog's input guard (350 ms) keeps a key meant for the menu from skipping a panel unseen (BUG-05).
- A beat plays once per save (`profile.storySeen`). A save from before CON-06 has seen what its records passed (G17): the intro of every chapter it played and the outro of every chapter it finished. The codex's chapter entries play a chapter's beats again.
- The words are data outside the app JS (`public/assets/content/story.json`, Korean drafts like the codex and the boss titles). The art is 20 panels (art/ui-art-spec.mjs `STORY_PANELS`), baked by `node scripts/build-ui-art.mjs story` into `public/assets/packs/story/`, 1.1 MB in all and loaded only when a beat plays. Fourteen are composed from the kit (the landmark vignettes widened to 16:9, the hero's poses, the chapter's enemies, its fallen ruler, the void and the seam). The six D-15 (b) gave their own drawing (the four prologue panels, ending-2, ending-4) are the kit's story module (K6, `art/concept-kit/k-story.js`, `PN.story`, 1200x675 with its paper grain), still provisional art until a human cleanup (style bible §15). Final hand-drawn panels replace the files without code changes.
- A round boss's second and third phase bring one narrated line over the boss bar for 3.6 s, outside the centre 40% (V3), from the same file (`phases`). The lines say what the phase changes, so they double as a reading aid for the phase moves (SYS-04, SYS-05). The fifteen boss title cards were FX-05's.
- Developer builds get the `PHASE` cheat, which takes the stage's boss past its next phase.

## Camera (FX-04)

The visible frame (`src/game/viewPolicy.ts`) shows 900 world units vertically and scales to the window. A window wider than 16:9 is pillarboxed at 1600 units across. Decision D-28 caps the zoom at 1.2 (the 1920×1080 size), so a larger window shows that frame with bars round it, and keeps at least 1200 units across, so a window narrower than 4:3 is letterboxed above and below. The frame's `offsetX` and `offsetY` place it in the canvas; the renderer, the pointer mapping, the off-screen markers, and the hurt vignette all go through them. Spawns use the fixed 1600×900 logical frame, so none of this changes a seeded outcome.

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
- A boss is the same hit circle in ink, with a heavier hostile rim and an upright paper crown; its phase rings and enraged spikes still show what the boss bar says. Every boss has kit art, so the per-boss vector bodies are gone too (`BOSS_ART` stays as the illustration registry's data). Hostile projectiles, beams, hazards (K11 draws fire from the hazards pack when it is in), and telegraphs keep their vector art.
- Without the skills pack, a player's shot is a cyan bead on ink at its hit size, a player's beam an ink band twice its hit half-width with a cyan core, a chain a cyan polyline on ink, a blade the old paper crescent, and a zone the hazard art; the mirror clones are the hero's own frame, faint.
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
