# Blackline Survivor Release Checklist

This checklist separates locally verifiable gates from Apple account and certificate gates. Do not publish an artifact that has skipped a required section.

## 1. Version and source

- [ ] Working tree and release commit are identified.
- [ ] `package.json` version and in-product version agree.
- [ ] The remaster rules are frozen for this build. If any rule change since the previous release (or, for the first release, since the playtest build) changes seeded outcomes, `RULES_VERSION` in `src/game/rules.ts` is raised so older infinite records stay apart (decision D-06, `docs/decisions/R3-decisions.md`).
- [ ] `com.blackline.survivor` is owned by the release account and does not collide with an existing product.
- [ ] Release notes include gameplay, save migration, known issues, and minimum macOS 12. Start from `docs/release-notes/1.0-draft.md`, which lists every rule change against 0.1.0 (R4 exit criterion 5); check it against `src/game/rules.ts` so a flag added since is not missing.
- [ ] `game-manual.html` matches the build: controls, modes, settings, and cheats, with screenshots from the release art.
- [ ] `npm ci` completes on a clean Node 22.6+ environment.

## 2. Automated gates

```sh
npm test
npm run test:coverage:core
npm run test:folded-rules
npm run test:balance:full
npm run test:balance:infinite
npm run test:soak
npm run test:dev-smoke
npm run test:ui-probes
npm run test:visual
npm run build
npm run test:electron-smoke
npm run bench:packs
npm run test:perf
```

`test:electron-smoke` and `bench:packs` run the production build from `npm run build`; they and `test:perf` need a desktop session. `test:ui-probes` and `test:visual` build the developer bundle themselves, and `test:electron-soak` needs `npm run build:developer` first.

- [ ] Unit, security, release-integrity, engine integration, and soak gates pass, and `npm run test:electron-soak` (the 45-minute desktop soak) passes on the release Mac.
- [ ] `npm run test:folded-rules` reports that the folded app engine plays exactly as the unfolded one (only the classic scenario may differ), so the shipped GameEngine is the one the balance and integration gates measured.
- [ ] `npm run test:dev-smoke` passes: the Vite dev server serves a styled page under the development CSP.
- [ ] `npm run test:ui-probes` passes every probe against the developer build (input guards, gamepad, fault recovery, audio, HUD footprint, focus, colour cues, save export, settlement, text size and contrast).
- [ ] `npm run test:electron-smoke` passes on the release Mac: the 1440x900 content size, the `app://game` origin, the first-launch `file://` save move with its backup and marker, sprite loading, the error log, and resumes after a renderer crash, a quit, and a force-quit.
- [ ] `npm run bench:packs` stays within the pack targets: a 1.5 s chapter transition, 96 MiB of resident textures, and 12 MiB per pack.
- [ ] `npm run test:perf` passes on the release Mac (TEC-04 D-3 targets), and the Intel Mac and 120 Hz numbers are recorded.
- [ ] Visual golden diff, console/page errors, nonblank output, overlap/occlusion, DPR 1/2, reduced-motion, and reduced-flash gates pass at the TEC-01 D-10 viewports (1024x720, 1280x720, 1440x900, 1920x1080). No golden set exists yet: the first one must be made on macOS, reviewed, and committed (in git LFS, decision D-21) before this box can be checked, since a capture-only run is not a pass.
- [ ] `artifacts/release-evidence/production-bundle-audit.json` reports no production debug or cheat marker.
- [ ] The full balance report (50 stages x 4 personas x 10 seeds = 2,000 scenarios under the remaster rules) is attached to the release record with its fingerprint and outlier scenarios, and compared with `artifacts/balance-remaster-baseline.json`. The runner exits 1 because `personaClearsObserved` fails by design: `fresh` (no upgrades or passives, a fixed square walk) clears 0 of 500. The balance gate is judged instead on:
  - the report's other gates all true: `completeMatrix`, `noInvalidOutcomes`, `noTimeouts`, `buildGrowthObserved`, `stageKindClearsObserved`;
  - the R3 balance gates in `docs/QUALITY_GATES.md`: the team personas' (striker, survivor, collector) normal-stage clear rates by chapter step by at most ±25 points between adjacent chapters, and at most 20% of their hits deal the minimum 1;
  - two opt-in runs (`BALANCE_FULL_PERSONAS`): `maxed` in all ten Ch5 stages x 10 seeds keeps its lowest-health median at or below 0.70, and `novice` in 1-1 x 100 seeds (1-100) clears within 40-70%.
- [ ] `npm run test:balance:infinite` (six seeds, at most 30 minutes) is recorded next to the last run in `docs/QUALITY_GATES.md`: survival, round bosses defeated, and score for the max and mid builds. It has no pass mark of its own.
- [ ] `artifacts/release-evidence/bundle-budget.json` passes all five budgets (app JS, vendor JS, CSS, initial assets, installed assets) defined in `docs/QUALITY_GATES.md`.
- [ ] Any `config/bundle-baseline.json` update matches the promoted release evidence and states its reason.
- [ ] No CSP violations appear during the menu, gameplay, draft, and settlement flow.

To retain the deterministic balance evidence:

```sh
BALANCE_FULL_REPORT=artifacts/balance-full-report.json npm run test:balance:full
```

## 3. Unsigned package smoke

These commands require the matching Electron runtime to exist in the local electron-builder cache. They do not require a signing identity.

```sh
npm run build:icon
npm run clean:release
npm run package:mac:arm64
npm run package:mac:x64
```

- [ ] arm64 app launches on Apple Silicon.
- [ ] x64 app launches on Intel macOS or under a clean x64 validation environment.
- [ ] Finder, Dock, About, DMG, and Gatekeeper surfaces display the production icon without a white fringe.
- [ ] Cold start, Stage launch, input, audio, save, restart, and quit pass on each architecture.
- [ ] The game loads from the `app://game/` origin (TEC-15), and internal navigation cannot leave its entry page, `app://game/index.html`.
- [ ] Non-HTTPS, credential-bearing, `file:`, and `javascript:` external URLs are rejected.

## 4. Signed release package

Prerequisites: a valid Developer ID Application certificate, Apple notarization credentials, and network access. Configure these only in the release CI secret store.

```sh
export CSC_LINK='...'
export CSC_KEY_PASSWORD='...'
export APPLE_ID='...'
export APPLE_APP_SPECIFIC_PASSWORD='...'
export APPLE_TEAM_ID='...'
npm run package:mac:release
```

- [ ] electron-builder reports a Developer ID signature for arm64 and x64 artifacts.
- [ ] DMG and ZIP artifacts are notarized and stapled.
- [ ] No secret value is printed in the build log or stored in the repository.

## 5. Artifact verification

Run for each produced `.app`, DMG, and ZIP as applicable:

```sh
npm run verify:mac:release
```

This command also checks packaged Electron fuse states and writes the checksum, CycloneDX SBOM, and release evidence manifest. To regenerate only the evidence after packaging:

```sh
npm run release:evidence
```

Equivalent individual commands for diagnosis:

```sh
codesign --verify --deep --strict --verbose=2 "release/mac-arm64/Blackline Survivor.app"
codesign -dv --verbose=4 "release/mac-arm64/Blackline Survivor.app"
spctl --assess --type execute --verbose=4 "release/mac-arm64/Blackline Survivor.app"
xcrun stapler validate "release/Blackline Survivor-<version>-mac-arm64.dmg"
```

- [ ] `codesign` identifies the expected Team ID and hardened runtime.
- [ ] `spctl` reports `accepted` with `Notarized Developer ID` origin.
- [ ] `stapler validate` succeeds without a network fallback.
- [ ] SHA-256 checksums are generated after all signing and stapling operations.
- [ ] `artifacts/release-evidence/checksums.sha256` matches every DMG, ZIP, blockmap, and update metadata file.
- [ ] `artifacts/release-evidence/sbom.cdx.json` and `release-evidence.json` are archived with the release.
- [ ] Packaged Electron fuses match `docs/ELECTRON_HARDENING.md` (the `file:` fuse is off, D-25), and `npm run test:electron-fuse-smoke` passes. After an Electron upgrade, regenerate `test/fixtures/chromium-local-storage` with `node scripts/make-local-storage-fixture.mjs` and rerun `npm run test:security`, so the save move still reads its localStorage format.

## 6. Clean-machine acceptance

- [ ] Install from DMG with no development tools present.
- [ ] Gatekeeper opens the app without override instructions.
- [ ] Complete: start -> draft -> boss -> settlement -> unlock -> restart.
- [ ] Upgrade from a 0.1.0 install passes: its version 2 save loads as version 3 with meta and options kept, and the first launch moves the `file://` origin's entries (the save, its backup, the infinite boards) to `app://game/`, writes the backup file and marker, and a second launch keeps them (TEC-08, TEC-15).
- [ ] Recovery from a corrupted primary save passes.
- [ ] The TEC-01 D-10 window sizes (1024x720, 1280x720, 1440x900, 1920x1080) have no overlap.
- [ ] Reduced motion/flash, keyboard-only flow, focus order, and screen reader names pass.
- [ ] A 15-minute run produces no crash and no material retained-memory growth.

## 7. Publish or rollback

- [ ] Release owner records artifact checksums, balance fingerprint, test results, and known issues.
- [ ] Previous signed release remains available for rollback.
- [ ] Save schema compatibility is confirmed before promotion.
- [ ] Publish only after every applicable box above is checked by a second reviewer.
