import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("exports the Fluxline sequencer as a static site", async () => {
  const html = await readFile(new URL("dist/client/index.html", root), "utf8");

  assert.match(html, /<title>Fluxline — Flux Lighting Sequencer<\/title>/);
  assert.match(html, /Lighting blocks/);
  assert.match(html, /Export.*Fluxline/);
  assert.match(html, /Roblox player/);
  assert.match(html, /REFERENCE AUDIO/);
  assert.match(html, /EVENT INSPECTOR/);
  assert.match(html, /Audio splitter/);
  assert.match(html, />Quick</);
  assert.match(html, />Look</);
  assert.match(html, />FX</);
  assert.match(html, />Cues</);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("includes the GitHub Pages workflow and social card", async () => {
  await Promise.all([
    access(new URL(".github/workflows/deploy-pages.yml", root)),
    access(new URL("dist/client/og.png", root)),
    access(new URL("dist/client/404.html", root)),
  ]);
});

test("contains the AccelSystems export schema", async () => {
  const source = await readFile(new URL("app/page.tsx", root), "utf8");
  for (const attribute of ["beam intensity", "gobo intensity", "red", "green", "blue", "hue", "iris", "pan", "shutter", "spin", "tilt"]) {
    assert.match(source, new RegExp(attribute));
  }
  for (const speed of ["color", "dim", "fade", "iris", "movement", "spin", "strobe"]) {
    assert.match(source, new RegExp(`speed: "${speed}"`));
  }
  for (const field of ["lh", "form", "phase", "groups", "blocks", "wings", "blend", "bounce", "reset"]) {
    assert.match(source, new RegExp(field));
  }
  assert.match(source, /AccelSystemsFKTC\.source\.AccelSystemsFKTC_R\.shows/);
  assert.match(source, /Function/);
  assert.match(source, /eventType/);
  assert.match(source, /eventType = event\.mode === "effect" \? "effects" : "status"/);
  for (const field of ["targetMode", "targetProfiles", "layerPriority", "fadeIn", "hold", "fadeOut"]) {
    assert.match(source, new RegExp(field));
  }
  assert.match(source, /Fluxline Player \(profile targets \+ layers\)/);
  assert.match(source, /type BoardMode = "fluxline" \| "accel"/);
  assert.match(source, /NEW LIGHTING PROJECT/);
  assert.match(source, /JDC1 FIXTURES TO CONTROL|profileLabel/);
  assert.match(source, /FLUX lighting group/);
});

test("ships an importable readable Roblox player", async () => {
  const [config, whitelist, boardBuilder, server, client] = await Promise.all([
    readFile(new URL("roblox/FluxlinePlayer/Config.luau", root), "utf8"),
    readFile(new URL("roblox/FluxlinePlayer/Whitelist.luau", root), "utf8"),
    readFile(new URL("roblox/FluxlinePlayer/BoardBuilder.luau", root), "utf8"),
    readFile(new URL("roblox/FluxlinePlayer/Server.server.luau", root), "utf8"),
    readFile(new URL("roblox/FluxlinePlayer/Client.client.luau", root), "utf8"),
  ]);
  assert.match(config, /AllowExperienceOwner/);
  assert.match(whitelist, /GetRankInGroup/);
  assert.match(server, /OnServerInvoke/);
  assert.match(server, /BoardBuilder\.EnsureBoard/);
  assert.match(boardBuilder, /Instance\.new\("Part"\)/);
  assert.match(boardBuilder, /Instance\.new\("SurfaceGui"\)/);
  assert.match(boardBuilder, /FluxlineShowBoard/);
  assert.match(client, /selectSong/);
  assert.doesNotMatch(client, /Instance\.new\("ScreenGui"\)/);
  assert.doesNotMatch([config, whitelist, boardBuilder, server, client].join("\n"), /obfuscator|loadstring/);
  await Promise.all([
    access(new URL("public/roblox/FluxlinePlayer.rbxm", root)),
    access(new URL("public/roblox/FluxlinePlayer-source.zip", root)),
  ]);
});

test("timeline blocks resize from both sides and the play marker scrubs", async () => {
  const [source, styles] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);
  assert.match(source, /onEventResizePointerDown/);
  assert.match(source, /resize-handle left/);
  assert.match(source, /resize-handle right/);
  assert.match(source, /onPlayheadPointerDown/);
  assert.match(source, /Move play marker/);
  assert.match(styles, /cursor: ew-resize/);
});

test("includes a local chapter-to-MP3 and ZIP splitter", async () => {
  const source = await readFile(new URL("app/AudioSplitter.tsx", root), "utf8");
  assert.match(source, /parseChapters/);
  assert.match(source, /Mp3Encoder/);
  assert.match(source, /JSZip/);
  assert.match(source, /Download ZIP/);
  assert.match(source, /stays on this device/);
});
