# Blackline Survivor Developer App

`Blackline Survivor Dev.app` is a standalone local macOS build with developer controls compiled in. It loads `dist-developer/index.html` directly and does not require a Vite server, localhost URL, or browser.

## Build and open

From the repository root:

```sh
npm run package:mac:developer
open "release-developer/mac-arm64/Blackline Survivor Dev.app"
```

The equivalent Finder workflow is to double-click `run-game-developer.command`. If the packaged app does not exist, the command builds it first and then opens it.

The launcher tries the packaged app first, then its executable directly, and
finally the local Electron developer runtime. It keeps the Terminal window open
and prints the log location when every route fails. To force a clean developer
app rebuild:

```sh
./run-game-developer.command --rebuild
```

For an unpackaged Electron smoke run without a web server:

```sh
npm run electron:developer
```

## Isolation from production

The developer app intentionally uses:

- product name `Blackline Survivor Dev`
- app ID `com.blackline.survivor.dev`
- renderer directory `dist-developer`
- package output directory `release-developer`
- package entry point `electron/main.developer.cjs`
- separate Electron application data derived from `blackline-survivor-dev`

The regular `npm run build` pipeline still audits `dist` for forbidden developer and cheat markers. A developer build performs the inverse check and fails unless the expected developer controls are present.

## Behavior

- Developer mode starts enabled in the packaged developer app.
- Chapter 1-5 stages are selectable immediately.
- Menu and in-run cheat inputs are available. In a run, the HUD's ⚙ button (developer mode on) opens the developer panel with the cheat input; the run keeps going while it is open.
- Every settled run is kept in a run log (decision D-07): mode, stage, outcome, time, kills, level, coins earned and left, damage taken, max health, the bonus goal, and skills held. The menu's Cheat Code section shows how many runs it holds and their median coin balance share, copies them as JSON (`런 기록 복사`), and clears them. It lives in localStorage (`blackline-survivor-dev-runlog`, the newest 500 runs) and shipped builds have none of it.
- `TURN` makes an endless run's chapter turn due and fells its round boss, so the next chapter (CON-08) comes as soon as its boss draft is picked. It takes the run off the board like the other cheats.
- `FIRE` lays a burning floor under the player and another beside it, to see fire and a body burning in it. It takes the run off the board like the other cheats.
- `FIRES` lays four map fires (radius 60, 74, 86, and 98) round the player that burn for good, to see the fire art at the sizes stages lay (K11).
- `TERRAIN` clears the field's hazards (the player's own zones stay) and lays the other terrain kinds round the player at the sizes stages and bosses lay them (K11): a slow pool (radius 150) with five of the chapter's enemies standing in it, water (200), a null zone (130) and a binding zone (52) as bosses lay them (they fade in and out on their timers), and two traps (80), one armed and one just shut. It takes the run off the board like the other cheats.
- `BIND` lays a binding zone at the player's feet, to see the hero bound in vines (K11). It takes the run off the board like the other cheats.
- `SHOCK` lays two shocks (radius 190) beside the player: one counting down with its cracks grown, and one that goes off at once, to see the telegraph, the burst, and the mark it leaves (K11). Neither deals damage. It takes the run off the board like the other cheats.
- `AFX1` to `AFX4` show the weapons' field effects (K10) round the player, in place of the field's hazards (the visual gate times its arsenal captures to their delays). `AFX1` casts the bone mortar's six look-alikes in turn 0.42 s later (brush downpour, falling scroll, ink pulse; ink pots, cluster pots, meteor brush); `AFX2` the chain spark's five 0.2 s later (ink lightning, thunderclap; spark, storm, and frost chains); neither deals damage. `AFX3` throws the four lobs at once (ink pots, the cluster pots' three splitting, a tar jar, and a meteor brush thrown leftward, which lands mirrored) beside a coin, two jades, and a bone mortar shell; they land for no damage. `AFX4` swaps the build for six weapons awakened at level 5, one of each kind (seventh seal, silence bell, frost chainlet, meteor brush, judgment line, eclipse halo), over two hundred enemies, for minimal detail. `AFX5` to `AFX10` stage the P1 awakening gimmicks (K10 3a) with no weapons of the player's own (they clear the build, the pickups, and the gimmick ground first); their ground lies for its own seconds but hurts no one, and the visual gate captures each 0.3 s after its cheat. `AFX5`: an ink pots fire with three enemies burning in it, one at its edge and one just outside, beside smoke, a tar gathering, and the meteor brush's mark under the player. `AFX6`: 24 caltrops and 12 graves (two rising 0.24 s later) beside a silenced enemy (the gate shows it on chapter 4's floor). `AFX7`: a crowd wearing silence bells, prey tags, and crows (one pecking 0.25 s later), a frozen enemy, a frightened one (a P2 mark's vector sign), two elites, and stunned ones. `AFX8`: the total eclipse of an awakened level 5 halo round the hero 0.2 s later, over a ring of enemies. `AFX9`: a tracking seal triangle pending, striking 0.6 s later; falling scrolls unrolling 0.18 and 0.54 s later; a seventh seal's seven seals with their eighth pending 0.12 s later (a second cast 0.32 s later), each striking 0.3 s after. `AFX10`: four lightning pillars and four spinning blades placed to be at their start, middle, just before, and at their end 0.3 s later. Each takes the run off the board like the other cheats.
- `BOMB` puts two fuse and two burst bombers around the player, the first fuse already planted halfway (SYS-14), to see their art, marks, and blast. It takes the run off the board like the other cheats.
- `PHASE` takes the stage's boss to just past its next phase (60% then 30% of its health), to see its phase move and the line it brings (CON-06).
- Chapter 6 remains unavailable.
- Developer-mode clears do not advance normal Stage unlock progress.
- The checkbox can temporarily disable developer access for comparison testing.

## Distribution boundary

The developer package receives a local ad-hoc signature so macOS can validate its nested Electron binaries. It is not Developer ID signed or notarized. Do not upload it to release storage, attach it to public releases, or substitute it for artifacts built with `npm run package:mac:release`.
