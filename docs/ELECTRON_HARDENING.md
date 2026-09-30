# Electron Hardening Record

## Runtime boundary

- Renderer sandboxing, context isolation, disabled Node integration, and web security are mandatory.
- Only the entry page `app://game/index.html` may remain in the application window (TEC-15).
- `app://` serves GET requests for files inside the build folder only. Another host, a path that leaves the folder, a folder, or another method gets a 404, and every response carries the content security policy.
- Credential-free HTTPS links may open in the operating-system browser. Every other external scheme is denied.
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
| `GrantFileProtocolExtraPrivileges` | on, temporary | The game loads from `app://` now (TEC-15), but the first-launch save move still reads the old `file:` origin through a `file:` page. Disable once the move is verified (below). |

The `file:` exception is explicit rather than silently inheriting Electron's default. It must not be described as fully hardened. R5 remains blocked until the packaged artifact is inspected with `npm run verify:electron:fuses -- <release-root>` and the fuse is off.

## App origin and the save move (TEC-15)

The game loads from `app://game/`. The scheme is registered before the app is ready as standard (relative URLs, localStorage), secure, and fetch-capable. The `file:` origin gave every local page one shared origin and needed the fuse above.

localStorage belongs to an origin, so a player's saves from a `file:` build are not visible at `app://`. On every launch, before the game window loads, `electron/saveMigration.cjs` runs:
1. If `storage-migrated.json` is in the app's data folder, it stops: the move is done.
2. A hidden, sandboxed window opens the empty `storage-bridge.html` from the build folder over `file:` and reads the game's entries (`blackline-survivor-*`). Other keys are left alone.
3. They go to `save-backup-file-origin-<time>.json` in the data folder, in the save export format.
4. A second hidden window on `app://game/storage-bridge.html` writes each entry the new origin does not have yet. It never overwrites one.
5. It reads everything back. If any entry is missing or differs, it writes no marker (the next launch tries again) and logs `storage-migration` to `logs/errors.log`. Otherwise it writes the marker.

If the move cannot finish, the player can paste the backup file's text into 설정 > 세이브 > 가져오기. The same screen exports the current saves as text (TEC-15 manual path). `npm run test:electron-smoke` seeds a played `file:` save into a throwaway data folder, checks that the first launch moves every entry with a backup and a marker, and that a second launch keeps the saves without moving again. The seed variable (`BLACKLINE_SEED_FILE_STORAGE`) is ignored in packaged builds.

`src/platform/saveSamples.test.ts` runs ten save samples (`src/platform/saveSamples.json`) through the move, then through the import of its backup file. The samples are a 0.1.0 legacy meta, a v2 save, v3 saves from first launch to endgame, a save cut short mid-write, and a save from a newer build. Every entry must arrive byte for byte and load the same, and the backup must restore every entry. The one exception is the newer build's save, which is never imported over (G17). Saves from the R2-R3 playtest builds join the samples for the R2 exit check.

**[Team check]** when to turn the fuse off:
- Keep it on through the R2-R3 playtest builds, so real players' saves move.
- Then, before R5, check with a packaged build whether a `file:` page can still read its localStorage with the fuse off.
  - If it can, turn the fuse off and keep the move.
  - If not, turn it off in a later release and leave players who skipped every earlier build to the manual import.

A player who goes back to a `file:` build after the move, and plays there, keeps that progress only on the old origin: the marker stops a second move. The manual export and import covers this case.

## Verification

```sh
npm run package:mac:arm64
npm run verify:electron:fuses -- release
```

Fuse verification reads each packaged Electron executable and fails when any state differs from `package.json`. Signing and notarization happen after electron-builder flips the fuses.
