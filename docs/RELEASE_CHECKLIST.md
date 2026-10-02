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
npm run test:balance:full
npm run test:soak
npm run test:visual
npm run test:perf
npm run build
```

- [ ] Unit, security, release-integrity, engine integration, balance, and soak gates pass, and `npm run test:electron-soak` (the 45-minute desktop soak) passes on the release Mac.
- [ ] `npm run test:perf` passes on the release Mac (TEC-04 D-3 targets), and the Intel Mac and 120 Hz numbers are recorded.
- [ ] Visual golden diff, console/page errors, nonblank output, overlap/occlusion, DPR 1/2, and reduced-motion gates pass at every target viewport.
- [ ] `artifacts/release-evidence/production-bundle-audit.json` reports no production debug or cheat marker.
- [ ] The 50 Stage x 3 build policy x 10 seed balance report fingerprint and outlier scenarios are attached to the release record.
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
- [ ] Internal navigation cannot leave the packaged `dist/index.html` entry.
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
- [ ] Upgrade from a v1 save and recovery from a corrupted primary save both pass.
- [ ] 320x568, 375x812, 768x1024, and 1440x900 layouts have no overlap.
- [ ] Reduced motion/flash, keyboard-only flow, focus order, and screen reader names pass.
- [ ] A 15-minute run produces no crash and no material retained-memory growth.

## 7. Publish or rollback

- [ ] Release owner records artifact checksums, balance fingerprint, test results, and known issues.
- [ ] Previous signed release remains available for rollback.
- [ ] Save schema compatibility is confirmed before promotion.
- [ ] Publish only after every applicable box above is checked by a second reviewer.
