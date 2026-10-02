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
- `TURN` makes an endless run's chapter turn due and fells its round boss, so the next chapter (CON-08) comes as soon as its boss draft is picked. It takes the run off the board like the other cheats.
- `PHASE` takes the stage's boss to just past its next phase (60% then 30% of its health), to see its phase move and the line it brings (CON-06).
- Chapter 6 remains unavailable.
- Developer-mode clears do not advance normal Stage unlock progress.
- The checkbox can temporarily disable developer access for comparison testing.

## Distribution boundary

The developer package receives a local ad-hoc signature so macOS can validate its nested Electron binaries. It is not Developer ID signed or notarized. Do not upload it to release storage, attach it to public releases, or substitute it for artifacts built with `npm run package:mac:release`.
