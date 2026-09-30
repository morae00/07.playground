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

Chapter packs (`assets/packs/<chapter>/`) have a 12 MiB per-pack target and resident textures a 96 MiB target; both are checked at runtime by the renderer spike, not by this script. The v2 baseline was first recorded before R0 fixes on commit 174eb99 (app 53,565 B, vendor 60,279 B). It then moved to the R0 milestone (60,407 B on 0e53a01). It now sits at an R1 interim point, 75,381 B measured on b762892, awaiting review at the R1 merge. `docs/decisions/TEC-05-app-js-baseline.md` lists what every R1 commit cost and what the team needs to confirm. A baseline change needs the budget report, the reason, and review in the same change.

## Balance

`npm run test:balance:smoke` is a deterministic pressure smoke test, not a difficulty verdict. `npm run test:balance:pilot` checks representative chapter boundaries and boss stages. A release candidate uses `npm run test:balance:full` across all 50 stages, four build policies, and ten fixed seeds. Three policies are representative builds whose permanent upgrades grow by chapter. The fourth, `fresh`, is a new player with no upgrades or passives (CON-09). Seed shards run through a bounded worker pool, then merge in canonical stage/persona/seed order. The JSON report records clear/death/timeout rates, simulated and wall-clock time percentiles, death causes (contact, shot, boss contact, boss shot, shock, fire, each marked when the boss was enraged), economy percentiles, build growth, scenario details, and a deterministic fingerprint.

The remaster baseline is `artifacts/balance-remaster-baseline.json` (CON-09): 2,000 scenarios under the remaster rules on commit bf4d474, after SYS-02, SYS-03, SYS-04, and two boss-fight fixes. Earlier full runs used the same seeds and personas:

| | bf13b46 (CON-09) | 565e8b2 (SYS-03) | 73d367c (SYS-02, SYS-04) | bf4d474 (boss fixes) |
|---|---:|---:|---:|---:|
| clear, all 2,000 | 52.0% | 51.2% | 39.6% | 40.0% |
| clears: striker / survivor / collector / fresh (of 500) | 299 / 456 / 284 / 0 | 294 / 466 / 264 / 0 | 220 / 410 / 162 / 0 | 224 / 416 / 159 / 0 |
| clear by chapter without fresh, Ch1 / 2 / 3 / 4 / 5 (%) | 23.3 / 59.0 / 72.3 / 91.7 / 100.0 | 27.3 / 54.3 / 69.3 / 90.7 / 99.7 | 23.7 / 41.7 / 43.3 / 70.3 / 85.0 | 24.0 / 46.0 / 42.7 / 70.3 / 83.3 |
| timeouts (20 min of play) | 0 | 0 | 2 | 1 |
| deaths: contact / shots / boss | 923 / 9 / 29 | 934 / 7 / 33 | 1120 / 57 / 21 | 1118 / 50 / 25 |
| boss stages without fresh, clear time p50 / max (s) | 199 / 1155 | 184 / 755 | 249 / 751 | 252 / 927 |
| fresh in 1-1, death p50 (s) | 45 | 67 | 72 | 72 |

Findings:

- Without `fresh`, clear rates rise with the chapter. The chapter growth modelled for upgrades outpaces the difficulty growth. SYS-02 (enemy roles) and SYS-04 (boss moves, stepped enrage) made Ch2 to Ch5 harder and flattened that curve; Ch1 stayed near 24%. Shot deaths rose from 7 to 50, because shooters lead their aim now. This is input for SYS-07.
- Boss fights got longer, and at 73d367c two never ended. A crowd at the enemy cap shoved the boss away from the player (fixed in 83c3294), and Ch3 and Ch5 bosses anchored in place although their phase grammars are not built yet (fixed in bf4d474).
- One fight still times out: 2-10 survivor, seed 211531, boss at 13% health after 20 minutes. The stepped enrage (SYS-04) stops at damage x2.0, so a tank build that keeps moving is never forced to end the fight. The 0.1.0 enrage (x4.5 and a silence field) was a hard stop. **[Team decision]** an overtime rule after the last enrage step, or accept the risk; either way this is why `noTimeouts` fails. `personaClearsObserved` fails because `fresh` clears 0 of 500.
- `fresh` walks a fixed square and runs into enemies, so it says little about a new player. The opt-in `novice` persona (`BALANCE_FULL_PERSONAS=novice`) has the same fresh meta but steers away from nearby threats with the analog stick every 0.1 s, circling instead of backing into walls. On bf4d474:
  - 1-1, 20 seeds: 50% clear (fresh 0 of 10) and 70% survive 3 minutes.
  - Ch1, 10 seeds each: 1-1 4/10, 1-2 3/10, 1-3 4/10, 1-4 4/10, 1-5 4/10, 1-6 2/10, 1-7 1/10, 1-8 1/10, 1-9 4/10, 1-10 1/10. Later stages are harder because the novice keeps the fresh meta throughout.
  - Contact still causes nearly every death.

CON-02 Ch1 tuning: by the novice proxy, 1-1 already clears within the R1 target band (40-70%), and 3-minute survival (70%) is near its 80% target. A longer opening ramp does not help (1-1, novice, 20 seeds): a 90 s ramp kept 50% clear but dropped 3-minute survival to 50%, and 120 s gave 45% and 65%. Fewer early enemies mean less XP and fewer drafts (median 14 drafts at 45 s, 5 at 90 s), so the player is weaker when the pressure arrives. The 45 s ramp stays. The R1 playtest (6 or more new players) decides the final Ch1 numbers.

## Game rules and grammar

Gameplay changes ship behind the rule set in `src/game/rules.ts`. `classic` reproduces 0.1.0 exactly and `remaster` is the default. Infinite-mode records and replay fixtures are kept per rules version: the remaster rules (v2) may change freely until a build ships them, and after that the first change to seeded outcomes must raise `RULES_VERSION`. `test/grammarContracts.integration.test.mjs` pins the preserved game grammar (stage structure, draft sizes, radii, tier mix, deterministic replay) and one regression test per R0 gameplay fix.

Skill numbers live in `src/game/skillNumbers.ts`; the engine and the draft-card copy both read them. `src/game/skillNumbers.snapshot.json` records every number and every generated card line. After an intended balance change, review the diff and refresh it with `UPDATE_SKILL_SNAPSHOT=1 npm run test:unit`.

## Visual and accessibility

`npm run test:visual` builds the developer bundle and captures the menu, infinite menu, infinite play, playing, paused, draft, settlement, and boss states at the TEC-01 viewports (1024x720, 1280x720, 1440x900, 1920x1080), at DPR 1 and 2, with normal and reduced motion: 128 captures. Phone and tablet sizes (320x568, 375x812, 768x1024) remain selectable with `VISUAL_VIEWPORTS`. It fails on console errors, blank Canvas output, viewport overflow, incoherent control overlap, missing images, and contract-level accessibility violations.

Captures are deterministic: seeded `Math.random` and `crypto`, and a paused Playwright clock that only moves when a step settles, so the game loop, timers, and the dialog input guard advance by exact amounts (TEC-06). Once the app has mounted, the gate runs the page clock to an exact tick count. Playwright adds the real time between installing and pausing its clock (0-2 ms) to `performance.now()`, which otherwise shifts moving sprites by a sub-pixel. Two runs of the same build produce identical images, in any viewport order.

`npm run test:ui-probes` drives the developer build with keyboard and a virtual gamepad (HUD focus, draft and settlement input guards, gamepad menu navigation). It also injects faults to check error recovery (TEC-14): a frame error, a render error, and a missing atlas page. The audio probes (AUD-01) check that two runs share one running audio context with its limiter, that clearing a crowd in one frame starts one kill voice, and that button clicks play UI cues. The death probe (FX-03) ends a run with the developer cheat KO and checks that the settlement waits for the death moment, which cannot be paused. `npm run test:dev-smoke` checks that `npm run dev` serves a styled page under the development CSP.

`npm run test:electron-smoke` (after `npm run build`, on a desktop session) launches the real Electron app with a throwaway data folder, so a player's save is never touched. It checks the 1440x900 content size (TEC-01), sprite loading under `file://` (TEC-03), a short run without console errors, the local error log, and reload after a forced renderer crash (TEC-14). CI runs on Linux without a display, so this check is part of the local and release gate.

Golden screenshot updates require explicit review. A capture-only run is not a regression pass. Goldens are made on macOS, the shipping platform, with `VISUAL_UPDATE_GOLDENS=1`; Linux CI renders fonts differently, so the CI visual job (1024x720 and 1440x900) runs without mandatory goldens and the full local/release matrix remains the acceptance gate. The first committed golden set is taken when the R1 character art lands, because R1 replaces nearly every pixel; until then renderer refactors are checked with the headless Canvas draw-call fingerprint: run `npm run fingerprint:draw > before.json` on the base commit and again after the change, then `node scripts/draw-fingerprint.mjs --compare before.json after.json` must report SAME for every scenario.

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
