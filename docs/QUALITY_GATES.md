# Quality gates

## Required on every change

- `npm test`
- `npm run test:coverage:core` (90% line and branch minimum)
- `npm run build`
- three-way bundle budget from `config/bundle-baseline.json` (policy version 2, see below)
- no production developer controls or forbidden debug markers
- no new TypeScript errors

Update `config/bundle-baseline.json` only when promoting a reviewed release, and keep its byte count equal to the attached bundle budget report. Updating the baseline merely to make a pull request pass is not allowed.

### Bundle budget policy (version 2, 2026-09-30)

`npm run verify:bundle` measures `dist/` in three groups:

| Group | Measure | Warning | Fail |
|---|---|---|---|
| App JS (every non-vendor chunk: `assets/index-*.js`, the lazy `App-*.js`, the atlas manifest) | gzip, against the recorded app baseline | +15% | +25% |
| Vendor JS (`assets/vendor-*.js`, split by `vite.config.ts`) | gzip, against the recorded vendor baseline | +15% | +60% or 96 KiB, whichever is lower |
| CSS | gzip | 32 KiB | 48 KiB |
| Initial assets (images, audio, fonts, data outside `assets/packs/`) | raw bytes | 3 MiB | 4 MiB |
| Installed assets (everything outside JS/CSS, including chapter packs) | raw bytes | 200 MiB | 250 MiB |

Chapter packs (`assets/packs/<chapter>/`) have a 12 MiB per-pack target and resident textures a 96 MiB target; both are checked at runtime by the renderer spike, not by this script. Only the common pack and the pack of the chapter on screen stay resident (ART-07). The v2 baseline was first recorded before R0 fixes on commit 174eb99 (app 53,565 B, vendor 60,279 B). It then moved to the R0 milestone (60,407 B on 0e53a01). It now sits at an R1 interim point, 75,381 B measured on b762892, awaiting review at the R1 merge. `docs/decisions/TEC-05-app-js-baseline.md` lists what every R1 commit cost and what the team needs to confirm. A baseline change needs the budget report, the reason, and review in the same change.

## Balance

`npm run test:balance:smoke` is a deterministic pressure smoke test, not a difficulty verdict. `npm run test:balance:pilot` checks representative chapter boundaries and boss stages. A release candidate uses `npm run test:balance:full` across all 50 stages, four build policies, and ten fixed seeds. Three policies are representative builds whose permanent upgrades grow by chapter. The fourth, `fresh`, is a new player with no upgrades or passives (CON-09). Seed shards run through a bounded worker pool, then merge in canonical stage/persona/seed order. The JSON report records clear/death/timeout rates, simulated and wall-clock time percentiles, death causes (contact, shot, boss contact, boss shot, shock, fire, each marked when the boss was enraged), economy percentiles, build growth, scenario details, and a deterministic fingerprint.

The remaster baseline is `artifacts/balance-remaster-baseline.json`: 2,000 scenarios under the remaster rules on commit f05b83e, the end of R1 (fingerprint 64444bdb1ab34b81). Earlier full runs used the same seeds and personas:

| | bf13b46 (CON-09) | 565e8b2 (SYS-03) | 73d367c (SYS-02, SYS-04) | bf4d474 (boss fixes) | f05b83e (R1 end) |
|---|---:|---:|---:|---:|---:|
| clear, all 2,000 | 52.0% | 51.2% | 39.6% | 40.0% | 41.1% |
| clears: striker / survivor / collector / fresh (of 500) | 299 / 456 / 284 / 0 | 294 / 466 / 264 / 0 | 220 / 410 / 162 / 0 | 224 / 416 / 159 / 0 | 221 / 444 / 157 / 0 |
| clear by chapter without fresh, Ch1 / 2 / 3 / 4 / 5 (%) | 23.3 / 59.0 / 72.3 / 91.7 / 100.0 | 27.3 / 54.3 / 69.3 / 90.7 / 99.7 | 23.7 / 41.7 / 43.3 / 70.3 / 85.0 | 24.0 / 46.0 / 42.7 / 70.3 / 83.3 | 28.0 / 49.0 / 47.7 / 66.7 / 82.7 |
| timeouts (20 min of play) | 0 | 0 | 2 | 1 | 2 |
| deaths: contact / shots / boss | 923 / 9 / 29 | 934 / 7 / 33 | 1120 / 57 / 21 | 1118 / 50 / 25 | 1085 / 59 / 27 |
| boss stages without fresh, clear time p50 / max (s) | 199 / 1155 | 184 / 755 | 249 / 751 | 252 / 927 | 222 / 1001 |
| fresh in 1-1, death p50 (s) | 45 | 67 | 72 | 72 | 65 |

Findings:

- Without `fresh`, clear rates rise with the chapter. The chapter growth modelled for upgrades outpaces the difficulty growth. SYS-02 (enemy roles) and SYS-04 (boss moves, stepped enrage) made Ch2 to Ch5 harder and flattened that curve; Ch1 stayed near 24%. Shot deaths rose from 7 to 50, because shooters lead their aim now. This is input for SYS-07.
- Boss fights got longer, and at 73d367c two never ended. A crowd at the enemy cap shoved the boss away from the player (fixed in 83c3294), and Ch3 and Ch5 bosses anchored in place although their phase grammars are not built yet (fixed in bf4d474).
- One fight still times out: 2-10 survivor, seed 211531, boss at 13% health after 20 minutes. The stepped enrage (SYS-04) stops at damage x2.0, so a tank build that keeps moving is never forced to end the fight. The 0.1.0 enrage (x4.5 and a silence field) was a hard stop. **[Team decision]** an overtime rule after the last enrage step, or accept the risk; either way this is why `noTimeouts` fails. `personaClearsObserved` fails because `fresh` clears 0 of 500.
- R1 end (f05b83e): clears 41.1%. Ch1 to Ch3 rose 3 to 5 points. The only rule changes since bf4d474 are FX-02 and ART-05, and the pilots below put the gain on FX-02: per-hit hit-stop had taken players' acting time. Ch4 and Ch5 moved within noise. The chapter curve is still inverted (Ch1 28% to Ch5 83%), which SYS-07 owns. `fresh` still clears 0 of 500.
- Two fights time out, both `survivor` in a final boss stage, and the boss keeps almost all its health: 2-10 seed 211531 at 99% (13% at bf4d474) and 5-10 seed 1510177 at 97%.
  - The persona's fixed square walk gets pinned against the arena's top edge.
  - The crowd sits at its 150 cap, so a mob is always nearer than the boss, and auto-aim, which takes the nearest target, never picks the boss.
  - Without per-hit hit-stop (FX-02), the walk and the boss's following repeat exactly every 70 s, so nothing breaks the loop. The uneven slow-downs of per-hit hit-stop likely broke it at bf4d474.
  - A player walks to the boss, so this is a persona artifact. It still shows that a boss can go unhurt for a whole fight, which adds weight to the overtime decision above; a boss-priority rule for auto-aim is another option. **[Team decision]**
- `fresh` walks a fixed square and runs into enemies, so it says little about a new player. The opt-in `novice` persona (`BALANCE_FULL_PERSONAS=novice`) has the same fresh meta but steers away from nearby threats with the analog stick every 0.1 s, circling instead of backing into walls. On bf4d474:
  - 1-1, 20 seeds: 50% clear (fresh 0 of 10) and 70% survive 3 minutes.
  - Ch1, 10 seeds each: 1-1 4/10, 1-2 3/10, 1-3 4/10, 1-4 4/10, 1-5 4/10, 1-6 2/10, 1-7 1/10, 1-8 1/10, 1-9 4/10, 1-10 1/10. Later stages are harder because the novice keeps the fresh meta throughout.
  - Contact still causes nearly every death.

CON-02 Ch1 tuning: by the novice proxy, 1-1 already clears within the R1 target band (40-70%), and 3-minute survival (70%) is near its 80% target. A longer opening ramp does not help (1-1, novice, 20 seeds): a 90 s ramp kept 50% clear but dropped 3-minute survival to 50%, and 120 s gave 45% and 65%. Fewer early enemies mean less XP and fewer drafts (median 14 drafts at 45 s, 5 at 90 s), so the player is weaker when the pressure arrives. The 45 s ramp stays. The R1 playtest (6 or more new players) decides the final Ch1 numbers.

FX-02 (two-layer hit-stop, `rareHitStop` rule) changes seeded outcomes, so it was piloted against its parent (FX-04) on 8 stages × 10 seeds × 4 personas:

| | before (FX-04) | after (FX-02) |
|---|---:|---:|
| clear, all 320 | 25.9% | 32.5% |
| clears: striker / survivor / collector / fresh | 17 / 59 / 7 / 0 | 22 / 71 / 11 / 0 |
| clear by stage: 1-1 / 1-3 / 1-5 / 1-8 / 1-10 / 2-5 / 3-10 / 5-5 | 25 / 15 / 23 / 20 / 8 / 38 / 15 / 65% | 28 / 18 / 25 / 25 / 18 / 53 / 28 / 68% |
| deaths: contact / shots / boss | 224 / 7 / 6 | 201 / 6 / 9 |
| fresh in 1-1, death p50 (s) | 68 | 73 |

Per-hit global hit-stop slowed the simulation while the budgeted stage and enrage clocks kept running (BUG-07). Players lost up to 8% of their acting time, and boss stages lost the most (1-10, 2-5, 3-10). FX-02 gives that time back. **[Team check]** either accept the easier boss stages, or fold the change into the CON-02 and SYS-07 tuning, for example with enrage timers. The R1-end full run above (f05b83e) includes it and ART-05's obstacle catalogue.

ART-05 (Ch1 environment kit, `kitProps` rule) takes obstacle footprints from the kit's prop catalogue instead of random ranges. Positions stay where they were, but every footprint changes. It was piloted against its parent (FX-02) on six Ch1 stages × 10 seeds × 4 personas:

| | before (FX-02) | after (ART-05) |
|---|---:|---:|
| clear, all 240 | 20.8% | 20.4% |
| clears: striker / survivor / collector / fresh | 1 / 49 / 0 / 0 | 1 / 48 / 0 / 0 |
| clear by stage: 1-1 / 1-3 / 1-5 / 1-7 / 1-8 / 1-10 | 28 / 18 / 25 / 13 / 25 / 18% | 28 / 20 / 23 / 10 / 23 / 20% |
| deaths: contact / shots / boss | 175 / 8 / 5 | 173 / 6 / 10 |
| boss stages, clear time p50 / max (s) | 394 / 933 | 394 / 488 |
| fresh in 1-1, death p50 (s) | 73 | 68 |

11 of 240 outcomes flipped, in both directions, and the clear rate moved by one scenario, which is within seed noise. Walls keep the old average footprint (200×130), while pillars shrink to prop size (a pole, a jar pile, a cart), leaving more open ground. In 1-10, fewer runs died to the crowd (28 to 23), and more reached the boss and died to its shots (5 to 9), which pass over props.

ART-07 builds the Ch2 and Ch3 maps from their kit catalogues in the same way. Piloted against its parent on six stages of each chapter × 10 seeds × 4 personas:

| | before | after (ART-07) |
|---|---:|---:|
| clear, all 480 | 37.5% | 36.0% |
| clears: striker / survivor / collector / fresh | 47 / 99 / 34 / 0 | 37 / 102 / 34 / 0 |
| clear by stage: 2-1 / 2-3 / 2-5 / 2-7 / 2-8 / 2-10 | 68 / 40 / 53 / 28 / 23 / 30% | 63 / 40 / 45 / 25 / 23 / 33% |
| clear by stage: 3-1 / 3-3 / 3-5 / 3-7 / 3-8 / 3-10 | 70 / 53 / 20 / 18 / 23 / 28% | 68 / 55 / 23 / 25 / 18 / 18% |
| timeouts (20 min of play) | 0 | 2 |
| deaths: contact / shots / boss | 286 / 6 / 7 | 287 / 10 / 8 |
| boss stages, clear time p50 / max (s) | 238 / 1136 | 287 / 541 |

- The overall rate moved by 7 of 480, within seed noise, but 75 outcomes flipped, more than in Ch1. The Ch2 and Ch3 crowds are denser, which likely makes the open ground the smaller pillars leave count for more.
- `striker` lost 13 clears to crowd contact and gained 3. **[Team check]** accept this with the art, or give the pillar family larger props; SYS-07 retunes the chapter curve either way.
- The two timeouts (2-5 and 2-10, both `survivor`, boss at 98% and 99% health) are the persona artifact of the R1-end run: both runs cleared before, and the new maps sent the square walk into the loop where auto-aim never picks the boss.

ART-08 does the same for Ch4 and Ch5. Piloted against its parent on six stages of each chapter × 10 seeds × 4 personas:

| | before | after (ART-08) |
|---|---:|---:|
| clear, all 480 | 57.5% | 56.5% |
| clears: striker / survivor / collector / fresh | 86 / 116 / 74 / 0 | 87 / 116 / 68 / 0 |
| clear by stage: 4-1 / 4-3 / 4-5 / 4-7 / 4-8 / 4-10 | 70 / 63 / 48 / 43 / 30 / 58% | 73 / 58 / 40 / 45 / 33 / 60% |
| clear by stage: 5-1 / 5-3 / 5-5 / 5-7 / 5-8 / 5-10 | 70 / 68 / 68 / 60 / 53 / 63% | 65 / 65 / 68 / 58 / 53 / 63% |
| timeouts (20 min of play) | 0 | 1 |
| deaths: contact / shots / boss | 190 / 7 / 6 | 196 / 4 / 8 |
| boss stages, clear time p50 / max (s) | 179 / 925 | 197 / 1189 |

The rate moved by 5 of 480 (71 flips), within seed noise. The timeout (5-10 `survivor`, boss at 96%) is the same persona artifact.

SYS-06 (obstacles as cover, `obstacleCover` rule) was piloted against its parent (TEC-10) on 13 stages from every chapter (1-1, 1-5, 1-10, 2-3, 2-5, 2-10, 3-3, 3-5, 3-10, 4-5, 4-10, 5-5, 5-10) × 10 seeds × 4 personas:

| | before | after (SYS-06) |
|---|---:|---:|
| clear, all 520 | 39.4% | 40.8% |
| clears: striker / survivor / collector / fresh | 48 / 118 / 39 / 0 | 56 / 118 / 38 / 0 |
| clear by chapter without fresh, Ch1 / 2 / 3 / 4 / 5 (%) | 31.1 / 52.2 / 42.2 / 66.7 / 86.7 | 30.0 / 52.2 / 50.0 / 65.0 / 90.0 |
| deaths: contact / shots / boss | 282 / 8 / 21 | 282 / 8 / 14 |
| boss stages, clear time p50 / max (s) | 233 / 1189 | 243 / 985 |

- Cover makes the game a little easier: 7 more clears of 520 (39 flips), most of them in 3-3 (55 to 68%) and among `striker` runs.
- Shot deaths did not move, because the personas never use cover on purpose. The gain comes from shots that happened to meet a wall.
- Boss deaths fell from 21 to 14.
- The three timeouts are the same `survivor` loops before and after.

## Game rules and grammar

Gameplay changes ship behind the rule set in `src/game/rules.ts`. `classic` reproduces 0.1.0 exactly and `remaster` is the default. Infinite-mode records and replay fixtures are kept per rules version: the remaster rules (v2) may change freely until a build ships them, and after that the first change to seeded outcomes must raise `RULES_VERSION`. `test/grammarContracts.integration.test.mjs` pins the preserved game grammar (stage structure, draft sizes, radii, tier mix, deterministic replay) and one regression test per R0 gameplay fix.

Skill numbers live in `src/game/skillNumbers.ts`; the engine and the draft-card copy both read them. `src/game/skillNumbers.snapshot.json` records every number and every generated card line. After an intended balance change, review the diff and refresh it with `UPDATE_SKILL_SNAPSHOT=1 npm run test:unit`.

## Visual and accessibility

`npm run test:visual` builds the developer bundle and captures the menu, infinite menu, infinite play, playing, paused, draft, settlement, and boss states at the TEC-01 viewports (1024x720, 1280x720, 1440x900, 1920x1080), at DPR 1 and 2, with normal and reduced motion: 128 captures. Phone and tablet sizes (320x568, 375x812, 768x1024) remain selectable with `VISUAL_VIEWPORTS`. It fails on console errors, blank Canvas output, viewport overflow, incoherent control overlap, missing images, and contract-level accessibility violations.

Captures are deterministic: seeded `Math.random` and `crypto`, and a paused Playwright clock that only moves when a step settles, so the game loop, timers, and the dialog input guard advance by exact amounts (TEC-06). Once the app has mounted, the gate runs the page clock to an exact tick count. Playwright adds the real time between installing and pausing its clock (0-2 ms) to `performance.now()`, which otherwise shifts moving sprites by a sub-pixel. Two runs of the same build produce identical images, in any viewport order.

`npm run test:ui-probes` drives the developer build with keyboard and a virtual gamepad (HUD focus, draft and settlement input guards, gamepad menu navigation). It also injects faults to check error recovery (TEC-14): a frame error, a render error, and a missing atlas page. The audio probes (AUD-01) check that two runs share one running audio context with its limiter, that clearing a crowd in one frame starts one kill voice, and that button clicks play UI cues. The death probe (FX-03) ends a run with the developer cheat KO and checks that the settlement waits for the death moment, which cannot be paused. The HUD probe (UI-02) measures the HUD's footprint on a 4 px grid, using element boxes for bars, art, chips, and buttons, and glyph boxes for text. It must stay at or under 7% of the screen at 1440×900 and 12% at 1024×720, and the centre 40% of the screen must stay clear. The pause probe (UI-04) checks the pause hub and the menu settings:
- The run stays stopped while the hub is open, and the hub has its four tabs.
- A health upgrade bought in the hub adds no health until the run resumes, then about +7 after one second and the full +20 after four (G6).
- The menu's settings tab can set reduced flash before any run.

The save probe (TEC-15) exports from the menu's settings and checks the text reaches the clipboard. It then pastes a text that is not an export, which is refused, and a changed export, which asks once more before importing and reloads with it. The hint probe (UI-09) checks that a first 1-1 run opens with the movement hint without pausing, below the centre band, and that a second run on the same save does not repeat it. The draft probe (UI-03) opens a draft at 1440×900 and 1024×720. It checks that the three cards sit centred and show their baked tiles, that no text is under 13 px, and that the dialog fits without scrolling. The settlement probe (UI-05) plays 1-1 for six seconds and clears it, at the same two sizes. It checks that Enter inside the input guard does nothing, that the settlement shows the victory portrait, the gold's parts, and the damage bars with no text under 13 px and no scrolling, and that Enter after the guard starts 1-2. `npm run test:dev-smoke` checks that `npm run dev` serves a styled page under the development CSP.

`npm run test:electron-smoke` (after `npm run build`, on a desktop session) launches the real Electron app with a throwaway data folder, so a player's save is never touched. It checks the 1440x900 content size (TEC-01), the `app://game` origin, the first-launch move of a seeded `file://` save with its backup file and marker, and a second launch that keeps the moved save (TEC-15). It also checks sprite loading (TEC-03), a short run without console errors, the local error log, and reload after a forced renderer crash (TEC-14). CI runs on Linux without a display, so this check is part of the local and release gate.

Golden screenshot updates require explicit review. A capture-only run is not a regression pass. Goldens are made on macOS, the shipping platform, with `VISUAL_UPDATE_GOLDENS=1`; Linux CI renders fonts differently, so the CI visual job (1024x720 and 1440x900) runs without mandatory goldens and the full local/release matrix remains the acceptance gate. The first committed golden set is taken when the R1 character art lands, because R1 replaces nearly every pixel; until then renderer refactors are checked with the headless Canvas draw-call fingerprint: run `npm run fingerprint:draw > before.json` on the base commit and again after the change, then `node scripts/draw-fingerprint.mjs --compare before.json after.json` must report SAME for every scenario. The headless fingerprint draws without sprites, so since TEC-10 it follows the load-failure silhouettes: TEC-10 changed every scenario by design (40-50% fewer canvas calls, for example c1s1-fresh 755,992 to 397,828), and later refactors compare against it.

## Performance

`npm run test:soak:smoke` checks deterministic simulation pressure in CI. Release performance additionally requires `npm run test:soak` plus a real Chromium or packaged Electron trace for a 15-minute representative run.

`npm run bench:render` (desktop session) measures the real renderer in Electron at 1440x900. It covers the TEC-04 stress scene (204 enemies, 240 hostile shots, 520 particles, 160 damage numbers) at DPR 1 and 2 and render scales 2.0 and 1.5, with sprites and vectors, plus two real late stages and runs with the frame rate unlocked. The first results and the provisional Canvas2D decision are in `docs/decisions/TEC-04-render-backend.md`. Headless Chromium can rasterize in software, so its frame times are not performance evidence.

Targets:

- frame p95 at or below 20ms
- frame p99 at or below 33ms
- retained heap growth at or below 20MiB
- entity and effect counts within documented caps
- no unexplained long-task or GC cluster

## Release evidence

A release record contains:

- commit and version
- Node and npm versions
- unit, security, integration, balance, visual, accessibility, and performance results
- arm64 and x64 package smoke results
- signature, Gatekeeper, notarization, and staple results
- SHA-256 checksums and dependency inventory
- save upgrade and rollback confirmation

`npm run release:evidence` collects available gate JSON, produces a CycloneDX SBOM, and writes SHA-256 manifests for packaged artifacts. It intentionally fails when no distributable exists.
