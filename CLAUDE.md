# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Blackline Survivor (흑백 타격 생존전): a monochrome ink-line survival action game (React UI + Canvas 2D, TypeScript, Vite, Electron, macOS first). It is in a remaster: planning lives in `artifacts/remaster/` (`plan.md`, `backlog-roadmap.json`). Backlog ids (BUG-, TEC-, SYS-, CON-, ART-, FX-, UI-, AUD-) and decision ids (D-01..D-29, `docs/decisions/R3-decisions.md`) appear in code comments, docs, and commit subjects. Design and decision docs are mostly in Korean.

## Repository quirks

- Git metadata is in `.repo-git`, not `.git`. Run git as `GIT_DIR=.repo-git GIT_WORK_TREE=. git …`. Work happens on `remaster/*` branches (`remaster/r2` is current); nothing is pushed.
- Commit subjects follow `<ITEM-ID>: <imperative summary> (D-xx)`, one backlog item per commit.
- `artifacts/remaster/` is untracked planning material. `artifacts/visual/`, `artifacts/performance/`, `artifacts/release/` are generated and ignored; `artifacts/release-evidence/` and `artifacts/balance-remaster-baseline.json` are committed evidence.
- Tools that launch the desktop app (`scripts/electron-smoke.mjs`, benches) use a temporary `--user-data-dir`. Never point anything at the player's real save.
- Nothing is downloaded without the user's approval (npm packages, fonts, git-lfs).

## Commands

Requires Node ≥ 22.6 (tests run `.ts` files directly through Node's type stripping; imports use explicit `.ts` extensions). There is no linter; `npx tsc -b` is the type check.

```sh
npm run dev                  # Vite dev server on 127.0.0.1
npm run build                # tsc + production build + production integrity check + bundle budget
npm run build:developer      # developer build into dist-developer (cheats, dev panel)
npm test                     # unit + Electron security + release + engine integration
npm run test:unit
node --test src/game/viewPolicy.test.ts          # one unit test file
npm run build:test-bundles && node --test test/enrage.integration.test.mjs   # one integration test
npm run test:coverage:core   # 90% line/branch on p0Core, worldMath, audioPolicy
```

Integration tests import headless bundles from `/tmp/blackline-survivor-p0/` (`testing.mjs` from `src/testing/engine.ts`, `App.mjs` from `src/App.tsx`); rebuild them with `npm run build:test-bundles` after changing source, or point `BLACKLINE_TEST_BUNDLE` / `BLACKLINE_APP_BUNDLE` at other builds.

Heavier gates (see `docs/QUALITY_GATES.md` for when each is required and what passes):

- Balance: `npm run test:balance:smoke`, `test:balance:pilot` (6 stages), `test:balance:full` (all 50 stages × 4 personas × 10 seeds, release candidates), `test:balance:infinite`. `BALANCE_RULE_PATCH` and the `BALANCE_FULL_*` env vars narrow a run.
- Browser/desktop: `npm run test:visual` (Playwright captures; `VISUAL_UPDATE_GOLDENS=1` only with explicit review), `test:ui-probes` (drives the developer build), `test:dev-smoke` (Vite dev server loads cleanly), `test:electron-smoke`, `test:soak:smoke`.
- Performance: `npm run test:perf` (release gate, TEC-04 D-3), `bench:render`, `bench:packs`.
- Audio levels: `npm run measure:loudness` (BS.1770 loudness of WAV files and packs, as played), `measure:mix` (records the developer build's buses in Chromium); findings and the open mix decision in `docs/decisions/AUD-05-loudness.md`.
- Render refactors: `npm run fingerprint:draw > before.json` on the base and after the change, then `node scripts/draw-fingerprint.mjs --compare before.json after.json` must say SAME.
- Asset bakes (deterministic, outputs are committed): `npm run build:atlas`, `build:ui-art` (`node scripts/build-ui-art.mjs story` for story panels only), `build:sfx`. `node scripts/art-review-sheet.mjs <subject>` renders kit art enlarged into a temp folder for review.
- Packaging: `npm run package:mac:developer` (ad-hoc signed dev app, never distribute), `package:mac:release`; release steps in `docs/RELEASE_CHECKLIST.md`.

## Architecture

`docs/ARCHITECTURE.md` is the reference; the parts that span many files:

- **Determinism.** `src/game/GameEngine.ts` is a fixed-step simulation with a seeded gameplay random stream. A seed plus a command log reproduces a run (`src/game/engine/harness.ts`); suspended runs (CON-04) and the infinite leaderboard rely on it. Cosmetic randomness is a separate stream, so visual changes cannot change outcomes.
- **Rule sets.** `src/game/rules.ts` defines `classic` (0.1.0 behaviour, kept bit-identical for A/B balance) and `remaster` rule sets as boolean flags. Every change to seeded gameplay outcomes goes behind a flag; classic fingerprints must not move. `RULES_VERSION` (2) namespaces records and replays; it stays put until a build ships the remaster rules, and after that the first outcome change bumps it.
- **Dependency direction.** content → engine contracts/world types → simulation → game events + `RenderWorld` → presentation and renderer → Canvas; input adapter → engine commands; platform → app shell. Content and engine modules never import React, DOM, Canvas, or Electron. The engine takes input only through `GameEngine.dispatch(command)` (`src/game/engine/contracts.ts`) and reports through events (`src/game/engine/events.ts`). `src/game/presentation/` turns events into particles, numbers, shake, and sound cues; `src/game/render/worldRenderer.ts` draws a read-only snapshot and never sees the engine.
- **Content as data.** Tables live in `src/content/data/` (plain, deep-frozen JSON-shaped modules indexed by `index.ts`). Vite builds emit them as `assets/content/tables.json` and swap the modules for a runtime read (`src/content/tableRuntime.ts`), so they count as data, not app JS. `src/content/campaign.ts` alone defines chapters/stages/boss stages.
- **Strings.** Every player-facing word is in `public/assets/content/strings/ko.json` (reference) and `en.json`. Code names keys (`StringKey` is typed from the Korean table); the engine hands the UI `Text` objects, and the UI resolves them with `t`/`tx` (`src/i18n/strings.ts`). `src/i18n/strings.test.ts` fails on missing/unused keys and on Korean left in code outside a short allowlist. Terms follow `docs/lore/glossary.md`.
- **Developer vs shipped builds.** `DEVELOPER_UI_AVAILABLE` (`src/platform/developerAccess.ts`) is a compile-time constant. Developer-only code must test it itself so production builds drop it; `scripts/verify-production-bundle.mjs` fails the build on leftover developer markers.
- **Tests reach the engine** through `ProbedGameEngine` (`src/game/engine/probe.ts`, exported by `src/testing/engine.ts`): spawn/place/patch rules, step ticks, read a plain copy of the world. The app entry never imports it.
- **Saves.** `src/platform/save.ts` keeps one versioned envelope (v3) plus a backup; migrations are checked against real 0.1.0 saves in `src/platform/fixtures/`. The desktop app serves the game from `app://game/` (`electron/appProtocol.cjs`) and moves old `file://` storage on first launch (`electron/saveMigration.cjs`).
- **Art pipeline.** Characters, enemies, bosses, icons, and environments come from the concept kit (`art/concept-kit/k-*.js`, SVG-string generators documented in `API-*.md`; `lib.js`, `hero.js`, `sprites.js`, `boss.js`, `board.js` are read-only originals). `art/atlas-spec.mjs` and `art/ui-art-spec.mjs` say what gets baked; bakes write chapter packs under `public/assets/packs/`, atlas pages and the manifest, and `src/ui/art/*.webp` + `uiArt.generated.css`. Do not hand-edit generated files. Hit radii and pivots are fixed by gameplay, never by sprite size (style bible V4). Style rules: `docs/art/style-bible.md`; pipeline: `docs/art/pipeline.md`.
- **Audio.** One `AudioContext` in `src/game/audio/mixer.ts` (buses → master → limiter, voice limits). Cue rules are in `src/content/data/soundCues.ts`; `art/sfx-spec.mjs` recipes are rendered by `scripts/build-sfx.mjs` into `public/assets/packs/sfx-common/` (append new recipes at the end, or later cues' files change). Music (AUD-03): `musicDirector.ts` (pure state machine, cue sheet rules) → `musicPlayer.ts` (Web Audio decks on the music bus), joined to the app by `musicBridge.ts`; it is built in only when `public/assets/packs/music/pack.json` exists (`__MUSIC_PACK__`).

## Budgets and evidence

- App JS gzip budget: `config/bundle-baseline.json` (policy in `scripts/lib/bundle-budget.mjs`). Never raise the baseline to make a change pass; per-commit growth is tracked in `docs/decisions/TEC-05-app-js-baseline.md`.
- Balance changes are judged against `artifacts/balance-remaster-baseline.json` and the gates in `docs/QUALITY_GATES.md`.

## Subagents

Art and music outsourcing goes to the project subagents in `.claude/agents/` (shared context: `CONTEXT.md`; the step-by-step orders: `docs/outsourcing/R4-orders.md`):
- `art-director`: read-only; reviews against the style bible, writes work orders for the kit artist, and reviews deliveries. It may run only `scripts/art-review-sheet.mjs`.
- `kit-artist`: draws concept-kit modules; may edit only `art/concept-kit/k-*.js` and `API-*.md`.
- `sound-designer`: may edit only `art/sfx-spec.mjs`, `art/audio/`, `public/assets/packs/sfx-common/`, `public/assets/packs/music/`.

`.claude/hooks/scope-guard.mjs` (their PreToolUse hook) enforces the scopes. The main session saves their reports, registers and bakes accepted art, writes renderer/playback code, and commits.
