# Electron Hardening Record

## Runtime boundary

- Renderer sandboxing, context isolation, disabled Node integration, and web security are mandatory.
- Only the packaged `dist/index.html` file may remain in the application window.
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
| `GrantFileProtocolExtraPrivileges` | on, temporary | The current Vite build loads modules and assets from `file:`. Disable only after migrating to a privileged custom application scheme and completing a packaged smoke test. |

The `file:` exception is explicit rather than silently inheriting Electron's default. It must not be described as fully hardened. R5 remains blocked until the packaged artifact is inspected with `npm run verify:electron:fuses -- <release-root>` and the custom-scheme migration is assessed.

## Verification

```sh
npm run package:mac:arm64
npm run verify:electron:fuses -- release
```

Fuse verification reads each packaged Electron executable and fails when any state differs from `package.json`. Signing and notarization happen after electron-builder flips the fuses.
