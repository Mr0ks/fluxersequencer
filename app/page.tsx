"use client";

import { ChangeEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

type CueType = string;
type SnapMode = "free" | "beat" | "bar";
type PaletteTab = "quick" | "look" | "fx" | "cues";
type EventMode = "status" | "effect";
type StatusFunction = "snap" | "fade";
type ProfileAttribute = "beam intensity" | "gobo intensity" | "red" | "green" | "blue" | "rgb" | "hue" | "iris" | "pan" | "shutter" | "spin" | "tilt";
type ProfileSpeed = "color" | "dim" | "fade" | "iris" | "movement" | "spin" | "strobe";
type EffectFunction = "run" | "halt";
type LayerKind = "base" | "look" | "movement" | "effect" | "override";
type TargetMode = "all" | "include" | "exclude" | "odd" | "even";
type BoardMode = "fluxline" | "accel";

type FixtureLane = {
  id: string;
  name: string;
  fixture: string;
  group: string;
  module: number;
  count: number;
  color: string;
  profileLabel: string;
};

type CueEvent = {
  id: string;
  laneId: string;
  type: CueType;
  label: string;
  time: number;
  duration: number;
  intensity: number;
  color: string;
  fade: number;
  mode: EventMode;
  statusFunction: StatusFunction;
  attribute: ProfileAttribute;
  value: number;
  fromValue: number;
  effectSpeed: ProfileSpeed;
  effectFunction: EffectFunction;
  low: number;
  high: number;
  form: string;
  phaseStart: number;
  phaseEnd: number;
  groups: number;
  blocks: number;
  wings: number;
  blend: number;
  bounce: boolean;
  reset: boolean;
  layer: LayerKind;
  layerPriority: number;
  targetMode: TargetMode;
  targetProfiles: number[];
  fadeIn: number;
  hold: number;
  fadeOut: number;
};

type Project = {
  id: string;
  name: string;
  bpm: number;
  duration: number;
  audioName: string;
  updatedAt: number;
  boardMode: BoardMode;
  lanes: FixtureLane[];
  events: CueEvent[];
};

const STORAGE_KEY = "fluxline.projects.v2";
const OUTPUT_BLOCKS = ["On", "Off", "Fade on", "Fade off"];
const STATE_CUES = ["Cue 1", "Cue 2", "Cue 3", "Cue 4", "Cue 5", "Cue 6", "Cue 7", "Cue 8", "Strobe"];
const PROFILE_ATTRIBUTES: { value: ProfileAttribute; label: string }[] = [
  { value: "beam intensity", label: "Beam intensity" },
  { value: "gobo intensity", label: "Gobo intensity" },
  { value: "rgb", label: "RGB colour" },
  { value: "red", label: "Red" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "hue", label: "Hue" },
  { value: "iris", label: "Iris" },
  { value: "pan", label: "Pan" },
  { value: "tilt", label: "Tilt" },
  { value: "shutter", label: "Shutter" },
  { value: "spin", label: "Spin" },
];
const PROFILE_STATUS_BLOCKS: { label: string; attribute: ProfileAttribute; value: number }[] = [
  { label: "Beam", attribute: "beam intensity", value: 100 },
  { label: "Gobo", attribute: "gobo intensity", value: 100 },
  { label: "Colour", attribute: "rgb", value: 100 },
  { label: "Hue", attribute: "hue", value: 50 },
  { label: "Iris", attribute: "iris", value: 100 },
  { label: "Pan", attribute: "pan", value: 0 },
  { label: "Tilt", attribute: "tilt", value: 75 },
  { label: "Shutter", attribute: "shutter", value: 100 },
  { label: "Spin", attribute: "spin", value: 0 },
];
const PROFILE_EFFECTS: { label: string; speed: ProfileSpeed; attribute: ProfileAttribute }[] = [
  { label: "Dim FX", speed: "dim", attribute: "beam intensity" },
  { label: "Colour FX", speed: "color", attribute: "rgb" },
  { label: "Fade FX", speed: "fade", attribute: "beam intensity" },
  { label: "Iris FX", speed: "iris", attribute: "iris" },
  { label: "Movement FX", speed: "movement", attribute: "pan" },
  { label: "Spin FX", speed: "spin", attribute: "spin" },
  { label: "Strobe FX", speed: "strobe", attribute: "shutter" },
];
const EFFECT_FORMS = ["pwm", "sine", "cosine", "ramp+", "ramp-", "ramp", "swing", "bump", "phase 2", "random"];
const EVENT_COLORS: Record<string, string> = {
  On: "#96e8c5",
  Off: "#7d8997",
  "Fade on": "#a5ebd0",
  "Fade off": "#8cd9bc",
  Reset: "#f4ca7b",
  "Hard reset": "#f29b92",
  Strobe: "#ff90cd",
  Cue: "#b9a7ff",
};

const cueDefaults = {
  mode: "status" as EventMode,
  statusFunction: "snap" as StatusFunction,
  attribute: "beam intensity" as ProfileAttribute,
  value: 100,
  fromValue: 0,
  effectSpeed: "dim" as ProfileSpeed,
  effectFunction: "run" as EffectFunction,
  low: 0,
  high: 100,
  form: "sine",
  phaseStart: 0,
  phaseEnd: 360,
  groups: 1,
  blocks: 1,
  wings: 1,
  blend: 90,
  bounce: false,
  reset: false,
  layer: "base" as LayerKind,
  layerPriority: 10,
  targetMode: "all" as TargetMode,
  targetProfiles: [] as number[],
  fadeIn: 0,
  hold: 0.5,
  fadeOut: 0,
};

const initialProject: Project = {
  id: "fluxline-demo",
  name: "Opening Night",
  bpm: 128,
  duration: 12,
  audioName: "",
  updatedAt: Date.now(),
  boardMode: "fluxline",
  lanes: [
    { id: "jdc1", name: "JDC1", fixture: "profile", group: "JDC1", module: 1, count: 4, color: "#b9a7ff", profileLabel: "JDC1" },
    { id: "front-wash", name: "Front wash", fixture: "wash", group: "front wash", module: 1, count: 6, color: "#8be3bf", profileLabel: "Front" },
    { id: "back-wash", name: "Back wash", fixture: "wash", group: "back wash", module: 1, count: 6, color: "#75d8ec", profileLabel: "Back" },
  ],
  events: [
    { ...cueDefaults, id: "demo-1", laneId: "front-wash", type: "Fade on", label: "Fade on", time: 0.75, duration: 1.1, intensity: 100, value: 100, statusFunction: "fade", color: "#bfaeff", fade: 0.6, fadeIn: 0.6, hold: 0.5 },
    { ...cueDefaults, id: "demo-2", laneId: "jdc1", type: "On", label: "JDC1 1 beam", time: 3.1, duration: 0.8, intensity: 100, value: 100, color: "#fff0cf", fade: 0, targetMode: "include", targetProfiles: [1], layer: "look" },
    { ...cueDefaults, id: "demo-3", laneId: "jdc1", type: "Movement FX", label: "JDC1 pan wave", time: 5.15, duration: 1.4, intensity: 68, mode: "effect", effectSpeed: "movement", attribute: "pan", low: -45, high: 45, color: "#ff90cd", fade: 0.2, layer: "movement", hold: 1.4 },
  ],
};

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(seconds: number, precise = false) {
  const safe = Math.max(0, seconds || 0);
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.floor((safe % 1) * 1000);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}${precise ? `.${String(millis).padStart(3, "0")}` : ""}`;
}

function filename(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "fluxline-show";
}

function download(name: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(href);
}

function downloadAsset(path: string, name: string) {
  const anchor = document.createElement("a");
  anchor.href = new URL(path, document.baseURI).href;
  anchor.download = name;
  anchor.click();
}

function luaString(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}

function normalizeEvent(event: Partial<CueEvent>): CueEvent {
  const isOff = event.type === "Off" || event.type === "Fade off";
  const isFade = event.type === "Fade on" || event.type === "Fade off";
  const isStrobe = event.type === "Strobe";
  return {
    ...cueDefaults,
    id: event.id || id("event"),
    laneId: event.laneId || "",
    type: event.type || "On",
    label: event.label || event.type || "Event",
    time: Number(event.time) || 0,
    duration: Math.max(0.1, Number(event.duration) || 0.5),
    intensity: isOff ? 0 : Number(event.intensity ?? event.value ?? 100),
    color: event.color || "#9ce9c9",
    fade: Number(event.fade) || 0,
    mode: event.mode || (isStrobe ? "effect" : "status"),
    statusFunction: event.statusFunction || (isFade ? "fade" : "snap"),
    attribute: event.attribute || (isStrobe ? "shutter" : "beam intensity"),
    value: isOff ? 0 : Number(event.value ?? event.intensity ?? 100),
    fromValue: Number(event.fromValue) || 0,
    effectSpeed: event.effectSpeed || (isStrobe ? "strobe" : "dim"),
    effectFunction: event.effectFunction || "run",
    low: Number(event.low ?? 0),
    high: Number(event.high ?? 100),
    form: event.form || (isStrobe ? "pwm" : "sine"),
    phaseStart: Number(event.phaseStart ?? 0),
    phaseEnd: Number(event.phaseEnd ?? (isStrobe ? 0 : 360)),
    groups: Math.max(1, Number(event.groups) || 1),
    blocks: Math.max(1, Number(event.blocks) || 1),
    wings: Number(event.wings ?? 1),
    blend: clamp(Number(event.blend ?? 90), 0, 100),
    bounce: Boolean(event.bounce),
    reset: Boolean(event.reset ?? isStrobe),
    layer: event.layer || (event.mode === "effect" ? (event.effectSpeed === "movement" ? "movement" : "effect") : "base"),
    layerPriority: clamp(Number(event.layerPriority ?? 10), 0, 100),
    targetMode: event.targetMode || "all",
    targetProfiles: Array.isArray(event.targetProfiles) ? event.targetProfiles.map(Number).filter((value) => value > 0) : [],
    fadeIn: Math.max(0, Number(event.fadeIn ?? (isFade && !isOff ? event.fade ?? 0.6 : 0))),
    hold: Math.max(0, Number(event.hold ?? event.duration ?? 0.5)),
    fadeOut: Math.max(0, Number(event.fadeOut ?? (isFade && isOff ? event.fade ?? 0.6 : 0))),
  };
}

function normalizeProject(project: Project): Project {
  return {
    ...project,
    boardMode: project.boardMode || "fluxline",
    lanes: (project.lanes || []).map((lane) => ({ ...lane, profileLabel: lane.profileLabel || lane.name || lane.fixture.toUpperCase() })),
    events: (project.events || []).map(normalizeEvent),
  };
}

function hexToFluxRgb(hex: string) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Math.round((parseInt(value.slice(offset, offset + 2), 16) / 255) * 100));
}

function luaValue(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return "nil";
  if (typeof value === "string") return luaString(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const indent = "\t".repeat(depth);
  const childIndent = "\t".repeat(depth + 1);
  if (Array.isArray(value)) {
    return `{\n${value.map((item, index) => `${childIndent}[${index + 1}] = ${luaValue(item, depth + 1)}`).join(",\n")}\n${indent}}`;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined);
  return `{\n${entries.map(([key, item]) => `${childIndent}[${luaString(key)}] = ${luaValue(item, depth + 1)}`).join(",\n")}\n${indent}}`;
}

function selectedProfiles(event: CueEvent, lane: FixtureLane) {
  const all = Array.from({ length: lane.count }, (_, index) => index + 1);
  const chosen = new Set(event.targetProfiles);
  if (event.targetMode === "include") return all.filter((profile) => chosen.has(profile));
  if (event.targetMode === "exclude") return all.filter((profile) => !chosen.has(profile));
  if (event.targetMode === "odd") return all.filter((profile) => profile % 2 === 1);
  if (event.targetMode === "even") return all.filter((profile) => profile % 2 === 0);
  return all;
}

function profileArguments(event: CueEvent, lane: FixtureLane, extended = false) {
  const base = { fixture: lane.fixture, group: lane.group, module: lane.module, range: "full" };
  const extension = extended ? {
    Target: { Mode: event.targetMode, Profiles: selectedProfiles(event, lane) },
    Layer: { Name: event.layer, Priority: event.layerPriority, FadeIn: event.fadeIn, Hold: event.hold, FadeOut: event.fadeOut },
  } : {};
  if (event.mode === "status") {
    const points = event.statusFunction === "fade" ? [event.fromValue, event.value] : [null, event.value];
    if (event.attribute === "rgb") {
      const [red, green, blue] = hexToFluxRgb(event.color);
      return (["red", "green", "blue"] as const).map((attribute, index) => ({ ...base, ...extension, attribute, points: event.statusFunction === "fade" ? [event.fromValue, [red, green, blue][index]] : [null, [red, green, blue][index]], ...(event.statusFunction === "fade" ? { speed: "fade" } : {}) }));
    }
    return [{ ...base, ...extension, attribute: event.attribute, points, ...(event.statusFunction === "fade" ? { speed: "fade" } : {}) }];
  }

  const effectBase = {
    ...base, ...extension,
    speed: event.effectSpeed,
    form: event.form,
    phase: [event.phaseStart, event.phaseEnd],
    groups: event.groups,
    blocks: event.blocks,
    wings: event.wings,
    blend: event.blend,
    bounce: event.bounce || undefined,
    reset: event.reset || undefined,
  };
  if (event.attribute === "rgb") {
    return (["red", "green", "blue"] as const).map((attribute) => ({ ...effectBase, attribute, lh: [`l ${attribute}`, `h ${attribute}`] }));
  }
  return [{ ...effectBase, attribute: event.attribute, lh: [event.low, event.high] }];
}

function projectToLuau(project: Project, extended = false) {
  let previous = 0;
  const lines = project.events
    .slice()
    .sort((a, b) => a.time - b.time)
    .map((event, index) => {
      const lane = project.lanes.find((item) => item.id === event.laneId) ?? project.lanes[0];
      const delay = Math.max(0, event.time - previous);
      previous = event.time;
      const command = event.mode === "effect" ? event.effectFunction : event.statusFunction;
      const eventType = event.mode === "effect" ? "effects" : "status";
      const data = { Arguments: profileArguments(event, lane, extended), Delay: Number(delay.toFixed(4)), Function: command, eventType };
      return `\t\t[${index + 1}] = ${luaValue(data, 2)}`;
    });

  return `-- Generated by Fluxline Sequencer\n-- Project: ${project.name}\n-- Format: ${extended ? "Fluxline Player (profile targets + layers)" : "native AccelSystemsFKTC"}\n-- ${extended ? "Place in ReplicatedStorage.FluxlinePlayer.Shows" : "Copy this show into AccelSystemsFKTC.source.AccelSystemsFKTC_R.shows"}\n\nreturn {\n\t["shows"] = {\n\t\t[${luaString(filename(project.name).replace(/-/g, "_"))}] = {\n${lines.join(",\n")}\n\t\t}\n\t}\n}\n`;
}

function eventSummary(event: CueEvent) {
  const target = event.targetMode === "all" ? "all" : event.targetMode === "include" || event.targetMode === "exclude" ? `${event.targetMode} ${event.targetProfiles.join(",") || "none"}` : event.targetMode;
  if (event.mode === "effect") return `${event.layer} · ${event.effectFunction} ${event.effectSpeed} · ${target}`;
  if (event.attribute === "rgb") return `RGB · ${event.color}`;
  return `${event.layer} · ${event.attribute} · ${Math.round(event.value)} · ${target}`;
}

export default function Home() {
  const [project, setProject] = useState<Project>(initialProject);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedLaneId, setSelectedLaneId] = useState(initialProject.lanes[0].id);
  const [selectedEventId, setSelectedEventId] = useState(initialProject.events[0].id);
  const [currentTime, setCurrentTime] = useState(1.875);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [snapMode, setSnapMode] = useState<SnapMode>("beat");
  const [zoom, setZoom] = useState(36);
  const [search, setSearch] = useState("");
  const [paletteTab, setPaletteTab] = useState<PaletteTab>("quick");
  const [audioUrl, setAudioUrl] = useState("");
  const [waveform, setWaveform] = useState<number[]>(Array.from({ length: 110 }, (_, i) => 0.25 + ((i * 37) % 64) / 100));
  const [projectPanel, setProjectPanel] = useState(false);
  const [lanePanel, setLanePanel] = useState(false);
  const [setupPanel, setSetupPanel] = useState(false);
  const [projectReady, setProjectReady] = useState(false);
  const [setup, setSetup] = useState({ name: "", boardMode: "fluxline" as BoardMode, groupName: "JDC1", fixture: "profile", fluxGroup: "JDC1", module: 1, count: 4 });
  const [saveState, setSaveState] = useState("Saved");
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<Project[]>([]);
  const redoRef = useRef<Project[]>([]);
  const playbackStartRef = useRef({ clock: 0, time: 0 });

  const selectedEvent = project.events.find((event) => event.id === selectedEventId) ?? null;
  const selectedLane = project.lanes.find((lane) => lane.id === selectedLaneId) ?? project.lanes[0];
  const beatSeconds = 60 / Math.max(1, project.bpm);
  const checksPass = project.lanes.length > 0 && project.events.every((event) => {
    const lane = project.lanes.find((item) => item.id === event.laneId);
    return lane && selectedProfiles(event, lane).length > 0;
  });

  const filteredBlocks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return OUTPUT_BLOCKS.filter((item) => item.toLowerCase().includes(query));
  }, [search]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Project[];
      if (stored.length) {
        const normalized = stored.map(normalizeProject);
        // Hydrate the editor once from browser storage.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProjects(normalized);
        setProject(normalized[0]);
        setSelectedLaneId(normalized[0].lanes[0]?.id ?? "");
        setSelectedEventId(normalized[0].events[0]?.id ?? "");
        setProjectReady(true);
      } else {
        setProjects([]);
        setSetupPanel(true);
      }
    } catch {
      setProjects([]);
      setSetupPanel(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !projectReady) return;
    // Reflect the autosave lifecycle in the header.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveState("Saving…");
    const timer = window.setTimeout(() => {
      const saved = { ...project, updatedAt: Date.now() };
      setProjects((existing) => {
        const next = [saved, ...existing.filter((item) => item.id !== project.id)].slice(0, 30);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      setSaveState("Saved");
    }, 450);
    return () => window.clearTimeout(timer);
  }, [project, hydrated, projectReady]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const audio = audioRef.current;
      const next = audioUrl && audio ? audio.currentTime : playbackStartRef.current.time + ((performance.now() - playbackStartRef.current.clock) / 1000) * speed;
      if (next >= project.duration) {
        setCurrentTime(project.duration);
        setPlaying(false);
        audio?.pause();
        return;
      }
      setCurrentTime(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, audioUrl, project.duration, speed]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (event.code === "Space") { event.preventDefault(); togglePlay(); }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedEventId) removeEvent(selectedEventId);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d" && selectedEvent) { event.preventDefault(); duplicateEvent(selectedEvent); }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const amount = event.shiftKey ? beatSeconds * 4 : snapMode === "free" ? 0.05 : beatSeconds;
        seek(currentTime + (event.key === "ArrowRight" ? amount : -amount));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  function snap(value: number) {
    const unit = snapMode === "free" ? 0.01 : snapMode === "bar" ? beatSeconds * 4 : beatSeconds;
    return clamp(Math.round(value / unit) * unit, 0, project.duration);
  }

  function pushProject(next: Project) {
    historyRef.current = [...historyRef.current.slice(-39), project];
    redoRef.current = [];
    setProject(next);
  }

  function undo() {
    const previous = historyRef.current.at(-1);
    if (!previous) return;
    historyRef.current = historyRef.current.slice(0, -1);
    redoRef.current = [project, ...redoRef.current].slice(0, 40);
    setProject(previous);
  }

  function redo() {
    const next = redoRef.current[0];
    if (!next) return;
    redoRef.current = redoRef.current.slice(1);
    historyRef.current = [...historyRef.current, project].slice(-40);
    setProject(next);
  }

  function seek(value: number) {
    const next = clamp(value, 0, project.duration);
    setCurrentTime(next);
    playbackStartRef.current = { clock: performance.now(), time: next };
    if (audioRef.current) audioRef.current.currentTime = Math.min(next, audioRef.current.duration || next);
  }

  function togglePlay() {
    if (playing) {
      setPlaying(false);
      audioRef.current?.pause();
      return;
    }
    if (currentTime >= project.duration) seek(0);
    playbackStartRef.current = { clock: performance.now(), time: currentTime >= project.duration ? 0 : currentTime };
    if (audioUrl && audioRef.current) {
      audioRef.current.playbackRate = speed;
      void audioRef.current.play();
    }
    setPlaying(true);
  }

  function addEvent(type: CueType, label = type, laneId = selectedLaneId, at = currentTime, patch: Partial<CueEvent> = {}) {
    const value = type === "Off" || type === "Fade off" ? 0 : 100;
    const event = normalizeEvent({
      id: id("event"), laneId, type, label, time: snap(at), duration: type.startsWith("Fade") ? Math.max(beatSeconds * 2, 0.8) : Math.max(beatSeconds, 0.4),
      intensity: value, value, color: type === "Cue" ? "#b9a7ff" : "#9ce9c9", fade: type.startsWith("Fade") ? 0.6 : 0,
      statusFunction: type.startsWith("Fade") ? "fade" : "snap",
      ...patch,
    });
    pushProject({ ...project, events: [...project.events, event] });
    setSelectedEventId(event.id);
    setSelectedLaneId(laneId);
  }

  function addProfileStatus(label: string, attribute: ProfileAttribute, value: number) {
    addEvent(label, label, selectedLaneId, currentTime, { mode: "status", statusFunction: "snap", attribute, value, intensity: clamp(value, 0, 100) });
  }

  function addProfileEffect(label: string, effectSpeed: ProfileSpeed, attribute: ProfileAttribute) {
    const movement = effectSpeed === "movement";
    const spin = effectSpeed === "spin";
    addEvent(label, label, selectedLaneId, currentTime, {
      mode: "effect", effectFunction: "run", effectSpeed, attribute, form: effectSpeed === "strobe" ? "pwm" : "sine",
      low: movement ? -45 : spin ? -100 : 0, high: movement ? 45 : 100,
      phaseEnd: effectSpeed === "strobe" || spin ? 0 : 360, reset: effectSpeed === "strobe",
    });
  }

  function updateEvent(patch: Partial<CueEvent>) {
    if (!selectedEvent) return;
    pushProject({ ...project, events: project.events.map((event) => event.id === selectedEvent.id ? { ...event, ...patch } : event) });
  }

  function toggleTargetProfile(profile: number) {
    if (!selectedEvent) return;
    const current = new Set(selectedEvent.targetProfiles);
    if (current.has(profile)) current.delete(profile); else current.add(profile);
    updateEvent({ targetMode: "include", targetProfiles: [...current].sort((a, b) => a - b) });
  }

  function updateTiming(field: "fadeIn" | "hold" | "fadeOut", value: number) {
    if (!selectedEvent) return;
    const timing = { fadeIn: selectedEvent.fadeIn, hold: selectedEvent.hold, fadeOut: selectedEvent.fadeOut, [field]: Math.max(0, value) };
    updateEvent({ ...timing, duration: Math.max(0.1, timing.fadeIn + timing.hold + timing.fadeOut), statusFunction: timing.fadeIn > 0 || timing.fadeOut > 0 ? "fade" : selectedEvent.statusFunction });
  }

  function removeEvent(eventId: string) {
    const nextEvents = project.events.filter((event) => event.id !== eventId);
    pushProject({ ...project, events: nextEvents });
    setSelectedEventId(nextEvents[0]?.id ?? "");
  }

  function duplicateEvent(event: CueEvent) {
    const copy = { ...event, id: id("event"), time: snap(event.time + beatSeconds) };
    pushProject({ ...project, events: [...project.events, copy] });
    setSelectedEventId(copy.id);
  }

  function onLaneClick(event: ReactPointerEvent<HTMLDivElement>, laneId: string) {
    if ((event.target as HTMLElement).closest("article")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const time = ((event.clientX - rect.left) / rect.width) * project.duration;
    setSelectedLaneId(laneId);
    seek(snap(time));
  }

  function onEventPointerDown(pointer: ReactPointerEvent<HTMLElement>, cue: CueEvent) {
    pointer.stopPropagation();
    setSelectedEventId(cue.id);
    setSelectedLaneId(cue.laneId);
    const rect = (pointer.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const startX = pointer.clientX;
    const startTime = cue.time;
    const before = project;
    let moved = false;
    const move = (event: PointerEvent) => {
      moved = true;
      const nextTime = snap(startTime + ((event.clientX - startX) / rect.width) * project.duration);
      setProject((current) => ({ ...current, events: current.events.map((item) => item.id === cue.id ? { ...item, time: nextTime } : item) }));
    };
    const up = () => {
      if (moved) { historyRef.current = [...historyRef.current.slice(-39), before]; redoRef.current = []; }
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  async function loadAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setProject((current) => ({ ...current, audioName: file.name }));
    try {
      const context = new AudioContext();
      const buffer = await context.decodeAudioData(await file.arrayBuffer());
      const data = buffer.getChannelData(0);
      const bars = 130;
      const size = Math.floor(data.length / bars);
      const peaks = Array.from({ length: bars }, (_, index) => {
        let peak = 0;
        for (let cursor = index * size; cursor < Math.min(data.length, (index + 1) * size); cursor += Math.max(1, Math.floor(size / 120))) peak = Math.max(peak, Math.abs(data[cursor]));
        return clamp(peak * 1.8, 0.12, 1);
      });
      setWaveform(peaks);
      setProject((current) => ({ ...current, duration: Math.max(4, Math.ceil(buffer.duration * 2) / 2) }));
      await context.close();
    } catch {
      setToast("Audio loaded. Waveform preview was unavailable.");
    }
  }

  function exportLuau() {
    download(`${filename(project.name)}.fluxline.lua`, projectToLuau(project, true), "text/plain");
    setToast("Layered show exported for the readable Fluxline Player");
  }

  function exportAccelLuau() {
    download(`${filename(project.name)}.accel.lua`, projectToLuau(project, false), "text/plain");
    const hasCustomTargets = project.events.some((event) => event.targetMode !== "all");
    setToast(hasCustomTargets ? "Accel export made. Profile-only targets require the Fluxline Player export." : "Native AccelSystems show exported");
  }

  function exportProject() {
    download(`${filename(project.name)}.fluxline.json`, JSON.stringify(project, null, 2), "application/json");
    setToast("Project backup downloaded");
  }

  function downloadPlayer() {
    downloadAsset("roblox/FluxlinePlayer.rbxm", "FluxlinePlayer.rbxm");
    setToast("Roblox installer downloaded — import it and press Play once");
  }

  async function importProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text()) as Project;
      if (!Array.isArray(imported.events) || !Array.isArray(imported.lanes)) throw new Error("Invalid project");
      const next = normalizeProject({ ...imported, id: id("project"), updatedAt: Date.now(), audioName: "" });
      setProject(next); setSelectedLaneId(next.lanes[0]?.id ?? ""); setSelectedEventId(next.events[0]?.id ?? "");
      setToast("Project imported"); setProjectPanel(false);
    } catch { setToast("That file is not a Fluxline project"); }
    event.target.value = "";
  }

  function newProject() {
    setSetup({ name: "", boardMode: "fluxline", groupName: "JDC1", fixture: "profile", fluxGroup: "JDC1", module: 1, count: 4 });
    setProjectPanel(false);
    setSetupPanel(true);
  }

  function createProject() {
    const laneId = id("group");
    const groupName = setup.groupName.trim() || "JDC1";
    const lane: FixtureLane = {
      id: laneId,
      name: groupName,
      fixture: setup.fixture.trim() || "profile",
      group: setup.fluxGroup.trim() || groupName,
      module: Math.max(1, setup.module),
      count: clamp(setup.count, 1, 64),
      color: "#b9a7ff",
      profileLabel: groupName,
    };
    const next: Project = {
      ...initialProject,
      id: id("project"),
      name: setup.name.trim() || "Untitled show",
      boardMode: setup.boardMode,
      updatedAt: Date.now(),
      lanes: [lane],
      events: [],
      audioName: "",
    };
    setProject(next); setProjects((existing) => [next, ...existing]); setSelectedLaneId(laneId); setSelectedEventId(""); setCurrentTime(0); setAudioUrl(""); setProjectReady(true); setSetupPanel(false);
  }

  function loadProject(item: Project) {
    const normalized = normalizeProject(item);
    setProject(normalized); setSelectedLaneId(normalized.lanes[0]?.id ?? ""); setSelectedEventId(normalized.events[0]?.id ?? ""); setCurrentTime(0); setAudioUrl(""); setProjectPanel(false);
  }

  function deleteProject(projectId: string) {
    const next = projects.filter((item) => item.id !== projectId);
    setProjects(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (project.id === projectId) newProject();
  }

  function addLane() {
    const groupNumber = project.lanes.length + 1;
    const lane: FixtureLane = { id: id("lane"), name: `Group ${groupNumber}`, fixture: "profile", group: `group ${groupNumber}`, module: 1, count: 4, color: "#b9a7ff", profileLabel: `G${groupNumber}` };
    pushProject({ ...project, lanes: [...project.lanes, lane] }); setSelectedLaneId(lane.id); setLanePanel(false);
  }

  const timeMarks = Array.from({ length: 7 }, (_, index) => (project.duration / 6) * index);

  return (
    <main className="sequencer-shell">
      {/* Reference music is user-supplied and has no caption track. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setPlaying(false)} />
      <input ref={audioInputRef} className="sr-only" type="file" accept="audio/*" onChange={loadAudio} />
      <input ref={importInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={importProject} />

      <header className="topbar">
        <button className="brand" onClick={() => setProjectPanel(true)} aria-label="Open projects">
          <span className="brand-mark">FL</span>
          <span className="brand-copy"><strong>Fluxline</strong><small>{project.name}</small></span>
        </button>
        <button className={`board-pill ${project.boardMode}`} onClick={newProject} title="Board type is chosen when a project is created">{project.boardMode === "fluxline" ? "Fluxline board" : "Accel board"}</button>
        <span className="save-pill"><i />{saveState}</span>
        <div className="top-actions">
          <button className="icon-button" aria-label="Undo" title="Undo" onClick={undo}>↶</button>
          <button className="icon-button" aria-label="Redo" title="Redo" onClick={redo}>↷</button>
          <button className="audio-button" onClick={() => audioInputRef.current?.click()}>♫ <span>{project.audioName || "Add audio"}</span></button>
          {project.boardMode === "fluxline" && <button className="player-button" onClick={downloadPlayer}>Roblox player</button>}
          <span className={`checks ${checksPass ? "pass" : "fail"}`}><i />{checksPass ? "Ready" : "Check project"}</span>
          <button className="export-button" onClick={project.boardMode === "fluxline" ? exportLuau : exportAccelLuau}>Export {project.boardMode === "fluxline" ? "Fluxline" : "Accel"}</button>
        </div>
      </header>

      <section className="workspace">
        <aside className="palette">
          <div className="panel-heading"><div><span>ADD TO TIMELINE</span><strong>Lighting blocks</strong></div><button onClick={() => addEvent("Cue", "Custom cue")} aria-label="Add custom cue">＋</button></div>
          <p className="panel-help"><b>1</b> Pick a group <b>2</b> place the playhead <b>3</b> add a block.</p>
          <button className="current-group" onClick={() => setLanePanel(true)}><span>CONTROLLING GROUP</span><strong>{selectedLane?.name || "Add a group"}</strong><small>{selectedLane?.group} · module {selectedLane?.module}</small></button>
          <nav className="palette-tabs" aria-label="Block categories">
            {([['quick', 'Quick'], ['look', 'Look'], ['fx', 'FX'], ['cues', 'Cues']] as [PaletteTab, string][]).map(([tab, label]) => <button key={tab} className={paletteTab === tab ? "active" : ""} onClick={() => { setPaletteTab(tab); setSearch(""); }}>{label}</button>)}
          </nav>
          {paletteTab !== "quick" && <label className="search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${paletteTab}`} /></label>}
          {paletteTab === "quick" && <>
            <div className="palette-section"><span>OUTPUT</span><div className="block-grid">{filteredBlocks.map((block) => <button key={block} onClick={() => addEvent(block)}>{block}</button>)}</div></div>
            <div className="palette-section"><span>ESSENTIALS</span><div className="quick-grid"><button onClick={() => addProfileStatus("Colour", "rgb", 100)}><b>●</b><span>Colour</span></button><button onClick={() => addProfileEffect("Movement FX", "movement", "pan")}><b>↝</b><span>Movement</span></button><button onClick={() => addEvent("Strobe", "Strobe")}><b>ϟ</b><span>Strobe</span></button><button onClick={() => addEvent("Stop FX", "Stop effect", selectedLaneId, currentTime, { mode: "effect", effectFunction: "halt", effectSpeed: "dim" })}><b>■</b><span>Stop FX</span></button></div></div>
            <div className="palette-section project-section"><span>PROJECT</span><div className="project-tools"><button onClick={() => setProjectPanel(true)}>Projects</button><button onClick={exportProject}>Backup</button><button onClick={() => importInputRef.current?.click()}>Import</button></div><button className="native-export" onClick={exportAccelLuau}>Download native Accel show</button><button className="native-export player-source" onClick={() => downloadAsset("roblox/FluxlinePlayer-source.zip", "FluxlinePlayer-source.zip")}>Readable player source</button></div>
          </>}
          {paletteTab === "look" && <div className="palette-section"><span>PROFILE ATTRIBUTES</span><div className="profile-grid">{PROFILE_STATUS_BLOCKS.filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase())).map((item) => <button key={item.label} onClick={() => addProfileStatus(item.label, item.attribute, item.value)}><strong>{item.label}</strong><small>{item.attribute}</small></button>)}</div></div>}
          {paletteTab === "fx" && <><div className="palette-section"><span>EFFECT ENGINES</span><div className="profile-grid effect-grid">{PROFILE_EFFECTS.filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase())).map((item) => <button key={item.speed} onClick={() => addProfileEffect(item.label, item.speed, item.attribute)}><strong>{item.label}</strong><small>{item.speed}</small></button>)}</div></div><button className="stop-fx" onClick={() => addEvent("Stop FX", "Stop effect", selectedLaneId, currentTime, { mode: "effect", effectFunction: "halt", effectSpeed: "dim" })}>■ Stop every effect</button></>}
          {paletteTab === "cues" && <div className="palette-section"><span>SAVED STATES</span><div className="cue-grid">{STATE_CUES.filter((cue) => cue.toLowerCase().includes(search.trim().toLowerCase())).map((cue) => <button key={cue} onClick={() => addEvent(cue === "Strobe" ? "Strobe" : "Cue", cue)}>{cue}<i /></button>)}</div></div>}
        </aside>

        <section className="timeline-panel">
          <div className="reference-track">
            <span>REFERENCE AUDIO</span>
            <button className="waveform" onClick={() => audioInputRef.current?.click()} aria-label="Load reference audio">{waveform.map((height, i) => <i key={i} style={{ height: `${Math.max(7, height * 52)}px` }} />)}{!audioUrl && <b>Load a track</b>}</button>
            <button className="track-button" onClick={() => audioInputRef.current?.click()}>{audioUrl ? "Replace" : "＋ Add track"}</button>
          </div>
          <div className="ruler" onPointerDown={(event) => { const rect = event.currentTarget.getBoundingClientRect(); seek(snap(((event.clientX - rect.left) / rect.width) * project.duration)); }}>{timeMarks.map((time, i) => <span key={i}><b>{i + 1}</b>{formatTime(time)}</span>)}</div>
          <div className="fixture-heading"><span>⌄</span><strong>FIXTURE GROUPS</strong><button onClick={() => setLanePanel(true)}>Manage</button><button className="add-lane" onClick={addLane}>＋ Add lane</button></div>
          <div className="lanes" style={{ minWidth: `${760 + zoom * 8}px` }}>
            {project.lanes.map((lane) => (
              <div className={`lane ${selectedLaneId === lane.id ? "selected" : ""}`} key={lane.id}>
                <div className="lane-label" role="button" tabIndex={0} onClick={() => setSelectedLaneId(lane.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedLaneId(lane.id); }}><strong>{lane.name}</strong><small>{lane.fixture} · {lane.group}</small><div className="profile-dots" title={project.boardMode === "fluxline" ? "Click a fixture number after selecting a block" : "Accel projects target the full FLUX group"}>{Array.from({ length: Math.min(lane.count, 12) }, (_, index) => { const profile = index + 1; const active = selectedEvent?.laneId === lane.id && selectedProfiles(selectedEvent, lane).includes(profile); return <button key={profile} disabled={project.boardMode === "accel"} className={active ? "active" : ""} style={{ borderColor: lane.color }} onClick={(event) => { event.stopPropagation(); setSelectedLaneId(lane.id); if (selectedEvent?.laneId === lane.id) toggleTargetProfile(profile); }} title={`${lane.profileLabel} ${profile}`}>{profile}</button>; })}</div></div>
                <div className="lane-grid" onPointerDown={(event) => onLaneClick(event, lane.id)}>
                  {project.events.filter((cue) => cue.laneId === lane.id).map((cue) => (
                    <article key={cue.id} className={selectedEventId === cue.id ? "selected-event" : ""} style={{ left: `${(cue.time / project.duration) * 100}%`, width: `${Math.max(2.8, (cue.duration / project.duration) * 100)}%`, background: EVENT_COLORS[cue.type] || (cue.mode === "effect" ? "#b9a7ff" : "#96e8c5") }} onPointerDown={(event) => onEventPointerDown(event, cue)} onDoubleClick={() => duplicateEvent(cue)}>
                      <strong><i className={`layer-dot ${cue.layer}`} />{cue.label}</strong><small>{eventSummary(cue)} · {formatTime(cue.time, true)}</small>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="playhead" style={{ left: `calc(145px + (100% - 145px) * ${currentTime / project.duration})` }} aria-hidden="true"><span>{playing ? "▶" : "II"}</span></div>
        </section>

        <aside className="inspector">
          <span>EVENT INSPECTOR</span>
          {selectedEvent && selectedLane ? <>
            <div className="inspector-title"><div><h2>{selectedEvent.label}</h2><p>{selectedLane.name} · {selectedLane.count} fixtures</p></div><button onClick={() => duplicateEvent(selectedEvent)} title="Duplicate">⧉</button></div>
            <label>Event name<input value={selectedEvent.label} onChange={(event) => updateEvent({ label: event.target.value })} /></label>
            <label>FLUX lighting group<select value={selectedEvent.laneId} onChange={(event) => { updateEvent({ laneId: event.target.value, targetMode: "all", targetProfiles: [] }); setSelectedLaneId(event.target.value); }}>{project.lanes.map((lane) => <option key={lane.id} value={lane.id}>{lane.name} — {lane.group}</option>)}</select></label>
            <section className="inspector-card">
              <header><span>{selectedLane.profileLabel} FIXTURES TO CONTROL</span><b>{selectedProfiles(selectedEvent, selectedLane).length}/{selectedLane.count} ON</b></header>
              {project.boardMode === "fluxline" ? <>
                <div className="target-modes">{(["all", "include", "exclude", "odd", "even"] as TargetMode[]).map((mode) => <button key={mode} className={selectedEvent.targetMode === mode ? "active" : ""} onClick={() => updateEvent({ targetMode: mode })}>{mode}</button>)}</div>
                <div className="profile-selector">{Array.from({ length: selectedLane.count }, (_, index) => { const profile = index + 1; const active = selectedProfiles(selectedEvent, selectedLane).includes(profile); return <button key={profile} className={active ? "active" : ""} onClick={() => toggleTargetProfile(profile)}><span>{active ? "●" : "○"}</span>{selectedLane.profileLabel} {profile}</button>; })}</div>
                <p>Green means this block controls that exact fixture number. You can select one JDC1, several, odd/even, or the complete group.</p>
              </> : <div className="accel-group-target"><strong>Whole group: {selectedLane.group}</strong><p>Accel show files use the full FLUX group. To control only JDC1 1, create a FLUX group containing only JDC1 1, then add that group as its own lane here.</p></div>}
            </section>
            <section className="inspector-card">
              <header><span>LAYER & CROSSFADE</span><b>Priority {selectedEvent.layerPriority}</b></header>
              <label>Layer<select value={selectedEvent.layer} onChange={(event) => updateEvent({ layer: event.target.value as LayerKind })}>{(["base", "look", "movement", "effect", "override"] as LayerKind[]).map((layer) => <option key={layer}>{layer}</option>)}</select></label>
              <label>Layer priority<input type="range" min="0" max="100" value={selectedEvent.layerPriority} onChange={(event) => updateEvent({ layerPriority: Number(event.target.value) })} /></label>
              <div className="timing-grid"><label>Fade in<input type="number" min="0" step="0.05" value={selectedEvent.fadeIn} onChange={(event) => updateTiming("fadeIn", Number(event.target.value))} /></label><label>Hold<input type="number" min="0" step="0.05" value={selectedEvent.hold} onChange={(event) => updateTiming("hold", Number(event.target.value))} /></label><label>Fade out<input type="number" min="0" step="0.05" value={selectedEvent.fadeOut} onChange={(event) => updateTiming("fadeOut", Number(event.target.value))} /></label></div>
              <div className="layer-preview"><i style={{ flex: selectedEvent.fadeIn || .05 }} /><b style={{ flex: selectedEvent.hold || .05 }} /><i style={{ flex: selectedEvent.fadeOut || .05 }} /></div>
            </section>
            <div className="mode-tabs"><button className={selectedEvent.mode === "status" ? "active" : ""} onClick={() => updateEvent({ mode: "status" })}>Direct value</button><button className={selectedEvent.mode === "effect" ? "active" : ""} onClick={() => updateEvent({ mode: "effect" })}>Effect engine</button></div>
            <label>Profile attribute<select value={selectedEvent.attribute} onChange={(event) => updateEvent({ attribute: event.target.value as ProfileAttribute })}>{PROFILE_ATTRIBUTES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            {selectedEvent.mode === "status" ? <>
              <label>Flux function<select value={selectedEvent.statusFunction} onChange={(event) => updateEvent({ statusFunction: event.target.value as StatusFunction })}><option value="snap">snap</option><option value="fade">fade</option></select></label>
              {selectedEvent.statusFunction === "fade" && <label>Fade from <output>{selectedEvent.fromValue}</output><input type="range" min="-100" max="100" value={selectedEvent.fromValue} onChange={(event) => updateEvent({ fromValue: Number(event.target.value) })} /></label>}
              {selectedEvent.attribute !== "rgb" && <label>Value <output>{selectedEvent.value}</output><input type="range" min={selectedEvent.attribute === "pan" || selectedEvent.attribute === "spin" ? -100 : 0} max="100" value={selectedEvent.value} onChange={(event) => updateEvent({ value: Number(event.target.value), intensity: clamp(Number(event.target.value), 0, 100) })} /></label>}
            </> : <>
              <label>Effect function<select value={selectedEvent.effectFunction} onChange={(event) => updateEvent({ effectFunction: event.target.value as EffectFunction })}><option value="run">run</option><option value="halt">halt</option></select></label>
              <label>Effect speed<select value={selectedEvent.effectSpeed} onChange={(event) => updateEvent({ effectSpeed: event.target.value as ProfileSpeed })}>{PROFILE_EFFECTS.map((item) => <option key={item.speed} value={item.speed}>{item.speed}</option>)}</select></label>
              <label>Form<select value={selectedEvent.form} onChange={(event) => updateEvent({ form: event.target.value })}>{EFFECT_FORMS.map((form) => <option key={form}>{form}</option>)}</select></label>
              {selectedEvent.attribute !== "rgb" && <div className="field-row"><label>Low<input type="number" value={selectedEvent.low} onChange={(event) => updateEvent({ low: Number(event.target.value) })} /></label><label>High<input type="number" value={selectedEvent.high} onChange={(event) => updateEvent({ high: Number(event.target.value) })} /></label></div>}
              <div className="field-row"><label>Phase start<input type="number" value={selectedEvent.phaseStart} onChange={(event) => updateEvent({ phaseStart: Number(event.target.value) })} /></label><label>Phase end<input type="number" value={selectedEvent.phaseEnd} onChange={(event) => updateEvent({ phaseEnd: Number(event.target.value) })} /></label></div>
              <div className="field-row"><label>Groups<input type="number" min="1" max="32" value={selectedEvent.groups} onChange={(event) => updateEvent({ groups: clamp(Number(event.target.value), 1, 32) })} /></label><label>Blocks<input type="number" min="1" max="32" value={selectedEvent.blocks} onChange={(event) => updateEvent({ blocks: clamp(Number(event.target.value), 1, 32) })} /></label></div>
              <div className="field-row"><label>Wings<input type="number" min="-16" max="16" value={selectedEvent.wings} onChange={(event) => updateEvent({ wings: clamp(Number(event.target.value), -16, 16) })} /></label><label>Blend<input type="number" min="0" max="100" value={selectedEvent.blend} onChange={(event) => updateEvent({ blend: clamp(Number(event.target.value), 0, 100) })} /></label></div>
              <div className="toggle-row"><label><input type="checkbox" checked={selectedEvent.bounce} onChange={(event) => updateEvent({ bounce: event.target.checked })} /> Bounce</label><label><input type="checkbox" checked={selectedEvent.reset} onChange={(event) => updateEvent({ reset: event.target.checked })} /> Reset</label></div>
            </>}
            <div className="field-row"><label>Start<input type="number" step="0.01" value={selectedEvent.time} onChange={(event) => updateEvent({ time: clamp(Number(event.target.value), 0, project.duration) })} /></label><label>Total duration<input type="number" step="0.05" min="0.1" value={selectedEvent.duration} onChange={(event) => updateEvent({ duration: Math.max(0.1, Number(event.target.value)), hold: Math.max(0, Number(event.target.value) - selectedEvent.fadeIn - selectedEvent.fadeOut) })} /></label></div>
            {selectedEvent.attribute === "rgb" && <label>Colour<button className="colour-field" onClick={() => document.getElementById("event-colour")?.click()}><i style={{ background: selectedEvent.color }} />{selectedEvent.color}<b>red · green · blue</b></button><input id="event-colour" className="colour-input" type="color" value={selectedEvent.color} onChange={(event) => updateEvent({ color: event.target.value })} /></label>}
            <div className="inspector-note"><strong>Export mapping</strong><span>{selectedEvent.mode === "effect" ? `effects · ${selectedEvent.effectFunction} · ${selectedEvent.effectSpeed}` : `status · ${selectedEvent.statusFunction}`} · {selectedEvent.attribute} · module {selectedLane.module}</span><span>{selectedEvent.layer} layer · {selectedEvent.targetMode} · profiles {selectedProfiles(selectedEvent, selectedLane).join(", ") || "none"}</span></div>
            <button className="delete-event" onClick={() => removeEvent(selectedEvent.id)}>Delete event</button>
          </> : <div className="empty-inspector"><i>✦</i><h2>Select an event</h2><p>Choose a lighting block on the timeline to edit its Flux values.</p></div>}
        </aside>
      </section>

      <footer className="transport">
        <button className="skip" onClick={() => seek(0)} aria-label="Go to start">|◀</button><button className="play" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>{playing ? "Ⅱ" : "▶"}</button>
        <strong>{formatTime(currentTime)}<small>.{String(Math.floor((currentTime % 1) * 1000)).padStart(3, "0")}</small></strong>
        <div className="speed"><button onClick={() => setSpeed(0.5)} className={speed === 0.5 ? "active" : ""}>½×</button><button onClick={() => setSpeed(1)} className={speed === 1 ? "active" : ""}>1×</button><button onClick={() => setSpeed(2)} className={speed === 2 ? "active" : ""}>2×</button></div>
        <label>BPM <input type="number" min="30" max="300" value={project.bpm} onChange={(event) => setProject({ ...project, bpm: clamp(Number(event.target.value), 30, 300) })} /></label>
        <div className="transport-group"><span>GRID</span>{(["free", "beat", "bar"] as SnapMode[]).map((mode) => <button key={mode} className={snapMode === mode ? "active" : ""} onClick={() => setSnapMode(mode)}>{mode[0].toUpperCase() + mode.slice(1)}</button>)}</div>
        <label className="zoom">Zoom <input type="range" min="0" max="100" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label><span className="event-count">{project.events.length} events</span>
      </footer>

      {projectPanel && <div className="modal-backdrop" onPointerDown={(event) => event.target === event.currentTarget && setProjectPanel(false)}><section className="modal projects-modal"><header><div><span>PROJECT LIBRARY</span><h2>Your shows</h2><p>Projects are automatically saved in this browser.</p></div><button onClick={() => setProjectPanel(false)}>×</button></header><div className="modal-actions"><button className="primary" onClick={newProject}>＋ New project</button><button onClick={() => importInputRef.current?.click()}>Import backup</button></div><div className="project-list">{projects.map((item) => <article key={item.id} className={item.id === project.id ? "current" : ""}><button className="project-open" onClick={() => loadProject(item)}><span className="project-tile">{item.name.slice(0, 2).toUpperCase()}</span><span><strong>{item.name}</strong><small>{item.events.length} events · {item.lanes.length} groups · {item.boardMode === "accel" ? "Accel board" : "Fluxline board"}</small></span></button><button className="project-delete" onClick={() => deleteProject(item.id)}>Delete</button></article>)}</div></section></div>}

      {lanePanel && <div className="modal-backdrop" onPointerDown={(event) => event.target === event.currentTarget && setLanePanel(false)}><section className="modal lane-modal"><header><div><span>FLUX GROUP PATCH</span><h2>Your lighting groups</h2><p>Each lane is a reusable FLUX group. The group and module values must match Roblox Studio.</p></div><button onClick={() => setLanePanel(false)}>×</button></header><div className="lane-editor-labels"><span>Website name</span><span>Fixture type</span><span>FLUX group</span><span>Module</span><span>Fixtures</span></div><div className="lane-editor-list">{project.lanes.map((lane) => <article key={lane.id}><input value={lane.name} aria-label="Lane name" onChange={(event) => setProject({ ...project, lanes: project.lanes.map((item) => item.id === lane.id ? { ...item, name: event.target.value, profileLabel: event.target.value } : item) })} /><input value={lane.fixture} aria-label="Fixture type" onChange={(event) => setProject({ ...project, lanes: project.lanes.map((item) => item.id === lane.id ? { ...item, fixture: event.target.value } : item) })} /><input value={lane.group} aria-label="Flux group" onChange={(event) => setProject({ ...project, lanes: project.lanes.map((item) => item.id === lane.id ? { ...item, group: event.target.value } : item) })} /><input type="number" min="1" value={lane.module} aria-label="Flux module" onChange={(event) => setProject({ ...project, lanes: project.lanes.map((item) => item.id === lane.id ? { ...item, module: Math.max(1, Number(event.target.value)) } : item) })} /><input type="number" min="1" max="64" value={lane.count} aria-label="Profile count" onChange={(event) => setProject({ ...project, lanes: project.lanes.map((item) => item.id === lane.id ? { ...item, count: clamp(Number(event.target.value), 1, 64) } : item) })} /></article>)}</div><button className="primary wide" onClick={addLane}>＋ Add custom FLUX group</button></section></div>}

      {setupPanel && <div className="modal-backdrop setup-backdrop"><section className="modal setup-modal"><header><div><span>NEW LIGHTING PROJECT</span><h2>Set up your show</h2><p>Choose the board once, then patch your first FLUX group.</p></div>{projects.length > 0 && <button onClick={() => setSetupPanel(false)}>×</button>}</header><label className="setup-field">Project name<input value={setup.name} placeholder="e.g. Opening Night" onChange={(event) => setSetup({ ...setup, name: event.target.value })} /></label><div className="board-choice"><button className={setup.boardMode === "fluxline" ? "active" : ""} onClick={() => setSetup({ ...setup, boardMode: "fluxline" })}><b>Fluxline board</b><span>Individual JDC numbers, layers, fades and the readable in-game board.</span><i>Recommended</i></button><button className={setup.boardMode === "accel" ? "active" : ""} onClick={() => setSetup({ ...setup, boardMode: "accel" })}><b>AccelSystems board</b><span>Native Accel show files. Each lane controls its complete FLUX group.</span><i>Compatibility</i></button></div><div className="setup-group"><span>FIRST FLUX GROUP</span><div className="setup-grid"><label>Website name<input value={setup.groupName} onChange={(event) => setSetup({ ...setup, groupName: event.target.value })} /></label><label>FLUX group<input value={setup.fluxGroup} onChange={(event) => setSetup({ ...setup, fluxGroup: event.target.value })} /></label><label>Fixture type<input value={setup.fixture} onChange={(event) => setSetup({ ...setup, fixture: event.target.value })} /></label><label>Module<input type="number" min="1" value={setup.module} onChange={(event) => setSetup({ ...setup, module: Number(event.target.value) })} /></label><label>How many fixtures<input type="number" min="1" max="64" value={setup.count} onChange={(event) => setSetup({ ...setup, count: Number(event.target.value) })} /></label></div></div><button className="create-project" onClick={createProject}>Create project and start sequencing →</button></section></div>}

      {toast && <button className="toast" onClick={() => setToast("")}>{toast}<span>×</span></button>}
    </main>
  );
}
