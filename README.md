# Fluxline Sequencer

Fluxline is a browser-based timeline editor for Flux lighting shows. It saves projects on the current device, loads reference audio, supports beat/bar snapping, and exports both native AccelSystems Luau and an extended layered Fluxline show.

The Profile editor mirrors the capabilities found in the target Flux kit: beam intensity, gobo intensity, red, green, blue, hue, iris, pan, shutter, spin, and tilt. It also exposes Flux's Profile effect engines (`color`, `dim`, `fade`, `iris`, `movement`, `spin`, and `strobe`) with form, low/high, phase, groups, blocks, wings, blend, bounce, and reset controls.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Publish with GitHub Pages

1. Create a GitHub repository and add these files.
2. Push the `main` branch.
3. In the repository settings, open **Pages** and select **GitHub Actions** as the source.
4. The included `deploy-pages.yml` workflow builds and publishes the site automatically.

Both root-domain repositories (`username.github.io`) and project repositories are supported. The workflow sets the correct path prefix automatically.

## Using an exported show

Click **Export Luau** in Fluxline. In Roblox Studio, copy the generated show data into:

```text
Workspace.AccelSystemsFKTC.source.AccelSystemsFKTC_R.shows
```

Fluxline exports the same `Delay`, `Function`, `Arguments`, and `eventType` structure used by the AccelSystems test show found in the target place. Direct Profile commands are emitted as `status` events using `snap` or `fade`; effect-engine blocks are emitted as `effects` events using `run` and the live Flux preset metadata shape.

Each event can target all, included, excluded, odd, or even profile numbers. It can also live on a base, look, movement, effect, or override layer with its own priority, fade-in, hold, and fade-out timing. These additions are preserved in the extended Fluxline export. Native Accel export intentionally remains full-group because the inspected Accel model does not document a per-profile `range` value.

On first use, Fluxline asks you to create a project, choose either the readable Fluxline board or the native AccelSystems board, and patch the first FLUX lighting group. Every later project uses the same short setup. When a block is selected, its inspector can move it to another group and, for Fluxline-board projects, select exact fixtures such as JDC1 1 or JDC1 3. Accel-board projects control the complete FLUX group; make a one-fixture FLUX group when native Accel playback must control only one unit.

Use **Roblox player** to download `FluxlinePlayer.rbxm`. Import it into Studio and press Play once; it installs the board client and server modules. Edit `ServerScriptService.FluxlinePlayer.Config` to set user IDs, usernames, or group ranks. The full readable source is also downloadable from the site and stored in `roblox/FluxlinePlayer`.

## Project storage

Projects auto-save in browser storage on the current device. Use **Download backup** to create a portable `.fluxline.json` file and **Import project** to load it elsewhere. Reference audio stays local and must be selected again after reopening the browser.
