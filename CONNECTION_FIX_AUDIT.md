# XADON AI connection-stack repair audit

Date: 2026-09-12

## Main finding

The active entrypoint is `index.js`, which loads `֎.js`. The active WhatsApp socket is therefore the `makeWASocket()` implementation in `֎.js`; `amain.js` and `library/connection/connection.js` are not imported by the active entrypoint.

The connection stack had several reliability problems:

1. **Dynamic upstream version forcing**
   - `֎.js` called `fetchLatestBaileysVersion()` and passed that version into the custom `@musteqeem/baileys` fork.
   - The fork's own published quick-start does not require this override.
   - The repaired socket now lets the installed fork use its own protocol defaults.

2. **False 500/bad-session classification**
   - The old code wrapped every disconnect error with `new Boom(lastDisconnect?.error)`.
   - When the error is missing/unknown, this can manufacture a Boom-style 500 status and make the bot print `BAD SESSION` even when the real failure is a transport/protocol problem.
   - The repaired code reads the status directly and prints the raw error name/data/output.

3. **Duplicate-process/session conflict risk**
   - `global.botInstances` only protects against duplicates inside one Node process.
   - It cannot stop two Pterodactyl/PM2 processes from opening the same `sessions` directory.
   - The repaired code adds an atomic `.xadon-session.lock` containing the owning PID. A live owner blocks a second process; a stale lock is removed without touching authentication files.

4. **Reconnect lifecycle**
   - Socket destruction is separated from session deletion.
   - Reconnects preserve the authentication directory.
   - Stale socket updates are ignored.
   - SIGINT/SIGTERM release only the runtime lock and close the socket.

5. **Dependency lock mismatch**
   - `package.json` requested `@musteqeem/baileys` `^1.0.6`.
   - `package-lock.json` actually locked `^1.0.5` / package version `1.0.5`.
   - The repaired `package.json` is synchronized with the existing lock at `^1.0.5`, making installs reproducible instead of silently resolving a different dependency graph.

## Validation

- `node --check` passed for the repaired active `֎.js`.
- `node --check` passed for all JavaScript files in the project.
- `package.json` and `package-lock.json` now agree on the Baileys dependency.
- The active file contains no `fetchLatestBaileysVersion()` call.
- No connection-error path in the active file deletes the session directory.

## Important deployment rule

Run exactly one bot process against this `sessions` directory. If Pterodactyl starts `node index.js`, do not also start `node ֎.js`, `node amain.js`, or another copy of the bot against the same session.

The repaired bot deliberately does **not** delete the WhatsApp session automatically. If WhatsApp itself has permanently invalidated the credentials, preserving the files cannot make invalid credentials valid; manual re-pairing may still be required.
