# Quality gates

## Required on every change

- `npm test`
- `npm run test:coverage:core` (90% line and branch minimum)
- `npm run build`
- production bundle gzip at or below the 120 KiB hard limit; review at 105 KiB; fail above 10% growth from `config/bundle-baseline.json`
- no production developer controls or forbidden debug markers
- no new TypeScript errors

Update `config/bundle-baseline.json` only when promoting a reviewed release, and keep its byte count equal to the attached bundle budget report. Updating the baseline merely to make a pull request pass is not allowed.

## Balance

`npm run test:balance:smoke` is a deterministic pressure smoke test, not a difficulty verdict. `npm run test:balance:pilot` checks representative chapter boundaries and boss stages. A release candidate uses `npm run test:balance:full` across all 50 stages, three representative build policies, and ten fixed seeds. Seed shards run through a bounded worker pool, then merge in canonical stage/persona/seed order. The JSON report records clear/death/timeout rates, elapsed-time percentiles, economy percentiles, build growth, scenario details, and a deterministic fingerprint.

## Visual and accessibility

`npm run test:visual` covers menu, playing, boss, draft, paused, and settlement states at 320x568, 375x812, 768x1024, and 1440x900. It runs at DPR 1 and 2 with normal and reduced motion. It fails on console errors, blank Canvas output, viewport overflow, incoherent control overlap, missing images, and contract-level accessibility violations.

Golden screenshot updates require explicit review. A capture-only run is not a regression pass. The CI visual job runs a reduced viewport matrix without mandatory goldens; the full local/release matrix remains the acceptance gate.

## Performance

`npm run test:soak:smoke` checks deterministic simulation pressure in CI. Release performance additionally requires `npm run test:soak` plus a real Chromium or packaged Electron trace for a 15-minute representative run.

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
