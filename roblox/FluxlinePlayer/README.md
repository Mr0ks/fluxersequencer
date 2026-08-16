# Fluxline Player for Roblox Studio

This is an original, readable companion for the AccelSystems Flux Kit Timecode model. It does not copy or deobfuscate Accel's private core.

## Install

1. Keep `Workspace.AccelSystemsFKTC` installed.
2. Put `Config`, `Whitelist`, and `Server.server` in a folder named `FluxlinePlayer` under `ServerScriptService`.
3. Put `Client.client` in `StarterPlayer > StarterPlayerScripts`.
4. Edit `Config` with your user IDs, usernames, or group ranks.
5. Export a native Accel show from the website for ordinary full-group playback.

The board discovers the existing `getShows`, `selectSong`, and `soundRemote` controls, creates itself in `PlayerGui`, and server-checks every board command before it reaches those controls.

## Profile targets and layers

Fluxline's extended export keeps `Target` and `Layer` metadata beside the exact Accel `Arguments`, `Delay`, `Function`, and `eventType` fields. `TargetResolver` understands profile attributes named `FluxProfileNumber`, `ProfileNumber`, or `ProfileId`, plus numeric instance suffixes. Connect the resolver to your readable FLUX adapter if your fixture package exposes a direct API. The native Accel export intentionally remains `range = "full"` because the inspected Accel show model does not document a per-profile range format.

The provided whitelist is server-authoritative. The inspected Accel whitelist currently ends with `return true`; replace or disable that original panel separately if you need the whole installed Accel system—not only this board—to be locked down.
