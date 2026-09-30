# Architecture

## Dependency direction

```text
content -> engine contracts -> engine systems -> render snapshots
  input -> engine commands                    -> UI and audio
platform ------------------------------------> application shell
```

## Rules

1. Content and engine modules do not import React, DOM, Canvas, or Electron APIs.
2. Input adapters translate keyboard, pointer, touch, and gamepad state into engine commands.
3. Rendering consumes immutable snapshots and visual contracts. It does not decide combat outcomes.
4. UI state owns navigation, focus, dialogs, and options, but not simulation state.
5. Platform modules own persistence, packaging boundaries, and release metadata.
6. Seeded gameplay randomness is isolated from cosmetic randomness so visual changes cannot alter outcomes.
7. New integration tests use public commands, snapshots, and diagnostics. Direct private-field mutation is transitional and must not expand.

## Input and commands (TEC-07)

`src/ui/inputAdapter.ts` owns the keyboard, pointer, and gamepad devices at the application level. It maps keys to the four movement actions (`ENGINE_ACTIONS`), pointer drags to world targets through `GameEngine.screenToWorld`, and the gamepad stick to analog movement, polling pads in `EngineCallbacks.onFrameStart`. The gamepad Start button is a UI event (`onPauseIntent`), not an engine command. The engine accepts input only through `GameEngine.dispatch(command)` with the commands in `src/game/engine/contracts.ts`; it registers no keyboard or pointer listeners. Draft cards carry an `offerId`, so `draft/select` commands can pick them from a log.

## Test access (TEC-07)

Tests, balance runners, and soak tools use `ProbedGameEngine` (`src/game/engine/probe.ts`), a test-only subclass whose `probe` API sets up worlds (spawn, place, patch, clear, halt spawns, set skills, cast), steps fixed ticks, observes every step (`onStep`), and reads a plain-data copy of the world (`read`). `createEngineHarness` (`src/game/engine/harness.ts`) implements the replay contract on the real engine: a seed plus a command log reproduces the same snapshot and fingerprint. The test bundle entry is `src/testing/engine.ts` (`npm run build:test-bundles`); the app entry never imports it, so production bundles do not ship the probe. Engine members are `protected` only so the probe subclass can reach them; nothing else subclasses the engine.

## Migration strategy

The current `GameEngine` remains the behavior reference. Extraction proceeds in small, test-backed moves:

1. Pure math, lifecycle, content, and visual policy modules.
2. Shared engine contracts for commands, snapshots, events, and replay records.
3. Individual simulation systems with deterministic fixtures.
4. Renderer, input, audio, and React shell adapters.

Every move must preserve fixed-step equivalence, seed fingerprints, campaign invariants, and save compatibility.
