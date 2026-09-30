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

The remaster baseline is `artifacts/balance-remaster-baseline.json` (CON-09). It covers 2,000 scenarios under the remaster rules on commit bf13b46, before the CON-02 pacing change. The findings to act on:

- `fresh` clears 0 of 500 scenarios. In stage 1-1 it dies to contact after 45 s of wall-clock time (median). This is why the `personaClearsObserved` gate fails and the full run exits 1. SYS-03's opening ramp targets it.
- Without `fresh`, clear rates fall as chapters rise: Ch1 23%, Ch2 59%, Ch3 72%, Ch4 92%, Ch5 100%. The chapter growth modelled for upgrades outpaces the difficulty growth. This is input for CON-02's Ch1 tuning and SYS-07.
- Contact causes 96% of deaths (923 of 961). Shots, boss shots, and boss contact cause the rest.

SYS-03 (encounter director) was compared on Ch1: 10 stages x 4 personas x 10 seeds, remaster rules, before and after.
- fresh: dies later in 1-1 (median about 68 s instead of 49 s) and kills twice as many, but still clears 0/100.
- striker clears 4/100 instead of 1/100; survivor 78/100 instead of 69/100.
Reaching the R1 playtest goals (1-1: 80% survive 3 minutes, 40-70% clear) is left to CON-02's Ch1 tuning of the base spawn rate and ramp.

## Game rules and grammar

Gameplay changes ship behind the rule set in `src/game/rules.ts`. `classic` reproduces 0.1.0 exactly and `remaster` is the default. Infinite-mode records and replay fixtures are kept per rules version: the remaster rules (v2) may change freely until a build ships them, and after that the first change to seeded outcomes must raise `RULES_VERSION`. `test/grammarContracts.integration.test.mjs` pins the preserved game grammar (stage structure, draft sizes, radii, tier mix, deterministic replay) and one regression test per R0 gameplay fix.

Skill numbers live in `src/game/skillNumbers.ts`; the engine and the draft-card copy both read them. `src/game/skillNumbers.snapshot.json` records every number and every generated card line. After an intended balance change, review the diff and refresh it with `UPDATE_SKILL_SNAPSHOT=1 npm run test:unit`.

## Visual and accessibility

`npm run test:visual` builds the developer bundle and captures the menu, infinite menu, infinite play, playing, paused, draft, settlement, and boss states at the TEC-01 viewports (1024x720, 1280x720, 1440x900, 1920x1080), at DPR 1 and 2, with normal and reduced motion: 128 captures. Phone and tablet sizes (320x568, 375x812, 768x1024) remain selectable with `VISUAL_VIEWPORTS`. It fails on console errors, blank Canvas output, viewport overflow, incoherent control overlap, missing images, and contract-level accessibility violations.

Captures are deterministic: seeded `Math.random` and `crypto`, and a paused Playwright clock that only moves when a step settles, so the game loop, timers, and the dialog input guard advance by exact amounts (TEC-06). Once the app has mounted, the gate runs the page clock to an exact tick count. Playwright adds the real time between installing and pausing its clock (0-2 ms) to `performance.now()`, which otherwise shifts moving sprites by a sub-pixel. Two runs of the same build produce identical images, in any viewport order.

`npm run test:ui-probes` drives the developer build with keyboard and a virtual gamepad (HUD focus, draft and settlement input guards, gamepad menu navigation). It also injects faults to check error recovery (TEC-14): a frame error, a render error, and a missing atlas page. `npm run test:dev-smoke` checks that `npm run dev` serves a styled page under the development CSP.

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
