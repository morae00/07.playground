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

## Game modes

- Campaign: 5 chapters and 50 stages with persistent unlocks and meta progression.
- Infinite: no time limit, continuously respawning random bosses, elapsed-time difficulty scaling, sparse ranged enemies, and a seed-shareable local top-10 scoreboard.

See [game-manual.html](game-manual.html) for controls, Infinite mode rules, developer mode, and cheat codes.

## Standalone developer app

The developer app runs from a local packaged renderer and does not require a Vite server or browser URL. It uses a separate app ID, product name, output directory, and local storage area from the production app.

Build the Apple Silicon app:

```sh
npm run package:mac:developer
open "release-developer/mac-arm64/Blackline Survivor Dev.app"
```

Alternatively, double-click `run-game-developer.command`. The first launch builds the app; later launches open the existing package. Developer mode starts enabled and exposes all Chapter 1-5 stages and the cheat panel.

`Blackline Survivor Dev.app` receives a local ad-hoc signature for Finder compatibility, but it is not Developer ID signed or notarized. Never distribute or promote it as a release. See [docs/DEVELOPER_APP.md](docs/DEVELOPER_APP.md).

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

## Release

Unsigned and signed macOS workflows are documented in [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md). Never publish a build that exposes developer controls or lacks attached test, balance, visual, performance, and signing evidence.
