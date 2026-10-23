# Electron Hardening Record

## Runtime boundary

- Renderer sandboxing, context isolation, disabled Node integration, and web security are mandatory.
- Only the entry page `app://game/index.html` may remain in the application window (TEC-15).
- `app://` serves GET requests for files inside the build folder only. Another host, a path that leaves the folder, a folder, or another method gets a 404, and every response carries the content security policy.
- The policy (`electron/security.cjs`) allows only the app's own scripts, styles, images (and data: images), fonts, fetches, and media, no workers, no objects, no forms, and no framing. Sound and music are fetched and decoded through Web Audio; `media-src` covers a future media element (TEC-09). The page's meta policy in `index.html` is the same list without `frame-ancestors`, which a meta tag cannot set, and a test keeps the two equal.
- Credential-free HTTPS links may open in the operating-system browser. Every other external scheme is denied.
- The page's only bridge into the app is the window mode (TEC-09, `electron/preload.cjs`): `window.blacklineDesktop` with `fullScreen()`, `setFullScreen(on)`, and `onFullScreen(listener)`. The preload exposes no Node access and no raw IPC. The main process answers the two channels only for the game's own top frame on its entry page (`isGameFrame`), accepts only a boolean, and keeps the mode in `window-state.json` in the app's data folder, so the next launch opens the same way. On macOS the View menu holds only the full-screen toggle (Ctrl+Cmd+F); it has no reload or developer tools.
- `requestSingleInstanceLock()` prevents a second process from creating another game window. A second launch restores and focuses the primary window.

## Packaged fuses

electron-builder flips the following Electron V1 fuses before signing:

| Fuse | State | Reason |
| --- | --- | --- |
| `RunAsNode` | off | Reject `ELECTRON_RUN_AS_NODE`. |
| `EnableCookieEncryption` | on | Protect any future cookie storage with OS-backed encryption. |
| `EnableNodeOptionsEnvironmentVariable` | off | Reject `NODE_OPTIONS` and `NODE_EXTRA_CA_CERTS` injection. |
| `EnableNodeCliInspectArguments` | off | Reject inspector flags and `SIGUSR1` inspector activation. |
| `EnableEmbeddedAsarIntegrityValidation` | on | Validate the packaged ASAR on supported platforms. |
| `OnlyLoadAppFromAsar` | on | Prevent fallback to unpackaged application code. |
| `LoadBrowserProcessSpecificV8Snapshot` | off | No separate `browser_v8_context_snapshot.bin` is shipped. Enabling this fuse without that file prevents Electron from starting. |
| `GrantFileProtocolExtraPrivileges` | off | The game loads from `app://` (TEC-15), and the first-launch save move reads the old `file:` origin from disk (D-25, below), so no page needs `file:` privileges. |

Inspect the packaged artifact with `npm run verify:electron:fuses -- <release-root>` before a release. `npm run test:electron-fuse-smoke` runs the desktop smoke on a copy of Electron with the `file:` fuse off, the way the release ships it (the other release fuses stay as they are, because the smoke drives the app over the Node inspector and runs it unpackaged).

## App origin and the save move (TEC-15)

The game loads from `app://game/`. The scheme is registered before the app is ready as standard (relative URLs, localStorage), secure, and fetch-capable. The `file:` origin gave every local page one shared origin and needed the fuse above.

localStorage belongs to an origin, so a player's saves from a `file:` build are not visible at `app://`. On every launch, before the game window loads, `electron/saveMigration.cjs` runs:
1. If `storage-migrated.json` is in the app's data folder, it stops: the move is done.
2. It copies Chromium's localStorage folder (`Local Storage/leveldb` in the data folder) byte for byte to `save-raw-copy-file-origin-<time>/` in the data folder (BUG-22). `main.cjs` takes the copy before the app is ready (`keepRawCopy`). Chromium opens that database as the app starts, before any window loads: it drops files the database does not reference, and it may start over a database it cannot open. The copy is made once: later attempts keep the first one, and a copy cut short by a crash is made again. A copy that fails is logged, tried again when the move runs, and does not stop the move.
3. The main process reads the `file:` origin's entries (`blackline-survivor-*`) from the live folder with a small read-only LevelDB reader (`electron/levelDbReader.cjs`: write-ahead logs and Snappy-compressed tables, the newest record of each key, deletions honoured). It runs before any page loads, but after Chromium has opened the database. Other keys are left alone. (A `file:` page cannot reach its localStorage once the `file:` fuse is off; the fuse smoke showed the old page-based read failing.)
4. They go to `save-backup-file-origin-<time>.json` in the data folder, in the save export format.
5. A second hidden window on `app://game/storage-bridge.html` writes each entry the new origin does not have yet. It never overwrites progress:
   - The save (`blackline-survivor-save-v2`, its `.backup`, and the 0.1.0 `blackline-survivor-meta-v1`) moves as one. The old save goes in whole when the new origin has none, or when everything it has is a fresh save. Otherwise none of it moves.
   - A fresh save is what the game writes by itself when it starts with no save. It is a version 3 envelope with only the envelope's fields. Its meta and profile hold nothing beyond the new player's (`createDefaultMeta`, `createDefaultProfile`): a missing field counts as the default, an unknown one never does. Its options, hints seen, and story beats seen may be anything.
   - Anything else counts as progress and is never overwritten: any gold, XP, upgrade, stage, record, career total, codex entry, achievement, character, cosmetic, or suspended run, a save from another version, or damaged text. `src/platform/saveMove.test.ts` keeps the definition equal to the game's defaults and checks it against real writes.
   - A leaderboard key the new origin has is replaced only when it has no runs on it.
6. It reads everything back. If any entry is missing or differs, or the old origin cannot be read at all, it writes no marker. Instead it writes `storage-migration-pending.json` (when, why, and which entries did arrive) and logs `storage-migration` to `logs/errors.log`, and the next launch tries again. Otherwise it writes the marker and removes the pending file.
7. The game window loads either way. The move leaves the page one localStorage key, `blackline-desktop-save-move`, outside the game's prefix so no export, import, or move carries it. The page reads it once, removes it, and shows a notice in the menu with where the raw copy and the backup file are (`src/platform/saveMove.ts`). The notice says one of three things:
   - `failed`: the move failed. Restart to try again; progress made now is kept and will not be overwritten.
   - `kept`: the new origin already had progress, so the old save was set aside in the backup file. The notice is not given for a save that already arrived in an earlier, partly failed attempt.
   - `unreadable`: an earlier attempt could not read the old origin, and it is now empty (Chromium dropped a database it could not open either). Only the raw copy has the old saves.
   This adds no IPC channel and nothing to the preload.

Recovery when the move cannot finish:
- Relaunching retries the move. A save the game started fresh in the meantime is replaced by the old one.
- If the player has made progress since, nothing is overwritten. They can paste the backup file's text into 설정 > 세이브 > 가져오기 to switch to the old save. The same screen exports the current saves as text (TEC-15 manual path).
- If the old origin could not be read at all, there is no backup file. The raw copy keeps the LevelDB folder as it was, so the saves can be recovered from it by hand, for example with a later build's reader.

`npm run test:electron-smoke` seeds a played `file:` save into a throwaway data folder with the stock Electron (`scripts/lib/seed-file-storage.mjs`). It then checks that the first launch moves every entry with a backup and a marker, and that a second launch keeps the saves without moving again. `npm run test:electron-fuse-smoke` does the same on a binary with the `file:` fuse off. `electron/saveMigration.test.cjs` covers the failures (BUG-22):
- A read that throws on the first launch, then a second launch that restores the old saves over the fresh one.
- Every kind of progress kept.
- The marker written only on success.
- The raw copy.
- The three notices.

`src/platform/saveSamples.test.ts` runs ten save samples (`src/platform/saveSamples.json`) through the move, then through the import of its backup file. The samples are a 0.1.0 legacy meta, a v2 save, v3 saves from first launch to endgame, a save cut short mid-write, and a save from a newer build. Every entry must arrive byte for byte and load the same, and the backup must restore every entry. The one exception is the newer build's save, which is never imported over (G17). Saves from the R2-R3 playtest builds join the samples for the R2 exit check.

Turning the fuse off (decision D-25, 2026-10-02): with the fuse off a `file:` page could no longer read its localStorage, so the move reads the old origin from disk instead of through a page, and the fuse is off. `electron/levelDbReader.test.cjs` reads a localStorage folder that Chromium itself wrote (`test/fixtures/chromium-local-storage`: a compacted, Snappy-compressed table plus a log with an overwrite, a removal, and an addition), a log cut short by a crash, and a damaged table, which fails the read so the move writes no marker and the next launch tries again (with the raw copy kept and the player told, BUG-22). The desktop tools seed a `file:` build's saves with the stock Electron (`scripts/lib/seed-file-storage.mjs`) before the app under test first launches.

A player who goes back to a `file:` build after the move, and plays there, keeps that progress only on the old origin: the marker stops a second move. The manual export and import covers this case.

## Writing saves to disk (CON-04)

Chromium writes localStorage to disk seconds after a change. A normal quit writes everything, but a force-quit, or a crash of the whole app, lost the last few seconds of saves, including the run the game had just suspended at a pause. The main process now flushes storage to disk every second (`session.defaultSession.flushStorageData()`), so such an exit loses at most about a second. `npm run test:electron-smoke` force-quits the app 1.5 s after a pause and checks that the next launch resumes the run from that pause. Without the flush, the run came back from its previous save.

## Verification

```sh
npm run package:mac:arm64
npm run verify:electron:fuses -- release
```

Fuse verification reads each packaged Electron executable and fails when any state differs from `package.json`. Signing and notarization happen after electron-builder flips the fuses.
