# Blackline Survivor

Blackline Survivor is a monochrome ink-line survival action game built with React, Canvas, TypeScript, Vite, and Electron.

## Requirements

- Node.js 22.6 or newer
- npm 10 or newer
- macOS 12 or newer for packaged desktop builds

## Run

```sh
npm ci
npm run dev
```

Production web build:

```sh
npm run build
npm run preview
```

Electron development launch:

```sh
npm run electron
```

## Quality gates

```sh
npm test
npm run test:coverage:core
npm run test:balance:smoke
npm run test:balance:pilot
npm run test:soak:smoke
npm run test:visual
npm run build
```

The default test command covers pure game contracts, save migration and recovery, Electron navigation policy, and GameEngine integration. Balance, real-browser visual, soak, and release packaging remain separate because they produce larger artifacts or require platform capabilities.

## Architecture

The game preserves a deterministic fixed-step engine and seeded gameplay random stream. New work should follow the dependency rules in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and the evidence requirements in [docs/QUALITY_GATES.md](docs/QUALITY_GATES.md).

The evolution plans and implementation report are available as standalone HTML documents:

- [Initial evolution plan](blackline-evolution-plan.html)
- [Next evolution reassessment](blackline-next-evolution-plan.html)
- [All-phase completion report](blackline-all-phases-complete.html)

## Release

Unsigned and signed macOS workflows are documented in [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md). Never publish a build that exposes developer controls or lacks attached test, balance, visual, performance, and signing evidence.
