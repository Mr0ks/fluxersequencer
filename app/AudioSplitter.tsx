"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Chapter = { time: number; name: string };

function parseClock(value: string) {
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN) || parts.length < 2 || parts.length > 3) return -1;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function parseChapters(text: string) {
  const chapters: Chapter[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^[-–—•]\s*/, "");
    if (!line) continue;
    const match = line.match(/^(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?\s*[-–—|:]?\s*(.+)$/)
      || line.match(/^(.+?)\s*[-–—|]\s*(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?$/);
    if (!match) continue;
    const timeFirst = /^\[?\d/.test(match[1]);
    const clock = timeFirst ? match[1] : match[2];
    const name = (timeFirst ? match[2] : match[1]).trim();
    const time = parseClock(clock);
    if (time >= 0 && name) chapters.push({ time, name });
  }
  return chapters
    .sort((a, b) => a.time - b.time)
    .filter((chapter, index, all) => index === 0 || chapter.time !== all[index - 1].time);
}

function safeName(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").slice(0, 90) || "Section";
}

function timeLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function downloadBlob(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function youtubeId(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0];
    if (url.hostname.includes("youtube.com")) return url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).at(-1) || "";
  } catch { return ""; }
  return "";
}

export default function AudioSplitter({ onClose }: { onClose: () => void }) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [chapterText, setChapterText] = useState("0:00 Opening\n1:30 Main show\n3:45 Finale");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const chapters = useMemo(() => parseChapters(chapterText).filter((chapter) => !audioBuffer || chapter.time < audioBuffer.duration), [chapterText, audioBuffer]);
  const videoId = youtubeId(youtubeUrl);
  const audioPreviewUrl = useMemo(() => audioFile ? URL.createObjectURL(audioFile) : "", [audioFile]);

  useEffect(() => () => { if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl); }, [audioPreviewUrl]);

  async function loadAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy("Reading audio…");
    setError("");
    try {
      const context = new AudioContext();
      const decoded = await context.decodeAudioData(await file.arrayBuffer());
      setAudioFile(file);
      setAudioBuffer(decoded);
      await context.close();
    } catch {
      setAudioFile(null);
      setAudioBuffer(null);
      setError("That audio file could not be decoded. Try a normal MP3, WAV, M4A, or AAC file.");
    } finally {
      setBusy("");
    }
  }

  async function encodeChapter(chapter: Chapter, index: number) {
    if (!audioBuffer) throw new Error("Choose an audio file first.");
    const end = chapters[index + 1]?.time ?? audioBuffer.duration;
    const startFrame = Math.max(0, Math.floor(chapter.time * audioBuffer.sampleRate));
    const endFrame = Math.min(audioBuffer.length, Math.floor(end * audioBuffer.sampleRate));
    if (endFrame <= startFrame) throw new Error(`The section “${chapter.name}” has no audio.`);

    const { Mp3Encoder } = await import("@breezystack/lamejs");
    const channels = Math.min(2, audioBuffer.numberOfChannels);
    const encoder = new Mp3Encoder(channels, audioBuffer.sampleRate, 192);
    const leftFloat = audioBuffer.getChannelData(0);
    const rightFloat = channels > 1 ? audioBuffer.getChannelData(1) : null;
    const mp3: Uint8Array[] = [];
    const chunkSize = 1152;

    for (let offset = startFrame; offset < endFrame; offset += chunkSize) {
      const length = Math.min(chunkSize, endFrame - offset);
      const left = new Int16Array(length);
      const right = rightFloat ? new Int16Array(length) : undefined;
      for (let sample = 0; sample < length; sample += 1) {
        const l = Math.max(-1, Math.min(1, leftFloat[offset + sample]));
        left[sample] = l < 0 ? l * 32768 : l * 32767;
        if (right && rightFloat) {
          const r = Math.max(-1, Math.min(1, rightFloat[offset + sample]));
          right[sample] = r < 0 ? r * 32768 : r * 32767;
        }
      }
      const encoded = encoder.encodeBuffer(left, right);
      if (encoded.length) mp3.push(encoded);
      if (offset % (chunkSize * 180) === 0) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    const final = encoder.flush();
    if (final.length) mp3.push(final);
    return new Blob(mp3 as BlobPart[], { type: "audio/mpeg" });
  }

  function chapterFilename(chapter: Chapter, index: number) {
    return `${String(index + 1).padStart(2, "0")} - ${safeName(chapter.name)}.mp3`;
  }

  async function downloadOne(chapter: Chapter, index: number) {
    try {
      setBusy(`Encoding ${chapter.name}…`);
      setError("");
      downloadBlob(await encodeChapter(chapter, index), chapterFilename(chapter, index));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create that section.");
    } finally { setBusy(""); }
  }

  async function downloadZip() {
    if (!audioBuffer || !audioFile || !chapters.length) {
      setError("Choose an audio file and add at least one valid timecode first.");
      return;
    }
    try {
      setError("");
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (let index = 0; index < chapters.length; index += 1) {
        setBusy(`Encoding ${index + 1} of ${chapters.length}: ${chapters[index].name}`);
        zip.file(chapterFilename(chapters[index], index), await encodeChapter(chapters[index], index));
      }
      setBusy("Building ZIP…");
      const output = await zip.generateAsync({ type: "blob", compression: "STORE" });
      downloadBlob(output, `${safeName(audioFile.name.replace(/\.[^.]+$/, ""))} - sections.zip`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the ZIP.");
    } finally { setBusy(""); }
  }

  return <div className="modal-backdrop audio-splitter-backdrop" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal audio-splitter-modal">
      <header><div><span>AUDIO TOOLS</span><h2>Concert chapter splitter</h2><p>Turn one local audio file into named MP3 sections using YouTube-style timecodes.</p></div><button onClick={onClose}>×</button></header>
      <div className="splitter-grid">
        <div className="splitter-inputs">
          <label>YouTube video URL <input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder="https://youtube.com/watch?v=…" /></label>
          {videoId && <a className="youtube-preview" href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer"><span>▶</span><strong>YouTube video connected</strong><small>Paste its chapter list below</small></a>}
          <label>Chapters or custom timecodes <textarea value={chapterText} onChange={(event) => setChapterText(event.target.value)} spellCheck={false} placeholder={'0:00 Opening\n12:35 Second act\n1:04:10 Finale'} /></label>
          <p className="splitter-tip">Copy the chapter list from the YouTube description, or type your own. Each timestamp starts a new file; the next timestamp ends it.</p>
          <label className="audio-drop">Local concert audio<input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac" onChange={loadAudio} /><span>{audioFile ? audioFile.name : "Choose MP3 or audio file"}</span><small>{audioBuffer ? `${timeLabel(audioBuffer.duration)} · stays on this device` : "Nothing is uploaded"}</small></label>
          {/* The local music preview has no spoken-video content to caption. */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          {audioPreviewUrl && <audio controls src={audioPreviewUrl} />}
        </div>
        <div className="chapter-preview">
          <header><div><span>FILES TO CREATE</span><strong>{chapters.length} sections</strong></div><button disabled={Boolean(busy) || !audioBuffer || !chapters.length} onClick={downloadZip}>Download ZIP</button></header>
          <div className="chapter-list">{chapters.map((chapter, index) => {
            const end = chapters[index + 1]?.time ?? audioBuffer?.duration;
            return <article key={`${chapter.time}-${chapter.name}`}><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{chapter.name}</strong><small>{timeLabel(chapter.time)}{end ? ` → ${timeLabel(end)}` : " → end"}</small></span><button disabled={Boolean(busy) || !audioBuffer} onClick={() => downloadOne(chapter, index)}>MP3</button></article>;
          })}{!chapters.length && <p>No valid chapters yet. Use one timestamp and name per line.</p>}</div>
          {busy && <div className="splitter-status"><i />{busy}</div>}
          {error && <div className="splitter-error">{error}</div>}
        </div>
      </div>
    </section>
  </div>;
}
