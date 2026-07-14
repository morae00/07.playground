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

## Migration strategy

The current `GameEngine` remains the behavior reference. Extraction proceeds in small, test-backed moves:

1. Pure math, lifecycle, content, and visual policy modules.
2. Shared engine contracts for commands, snapshots, events, and replay records.
3. Individual simulation systems with deterministic fixtures.
4. Renderer, input, audio, and React shell adapters.

Every move must preserve fixed-step equivalence, seed fingerprints, campaign invariants, and save compatibility.
