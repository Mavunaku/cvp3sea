#!/usr/bin/env node
// Builds a vertical 1080x1920 Instagram Reel from your own photos and/or video clips:
// optional title card, directional push-in pans on photos (varied per shot, not just a
// flat center zoom) / cover-cropped video clips, snappy crossfades, animated per-clip
// captions, optional outro CTA card, a cinematic color grade, and an optional music
// track. A single photo is automatically split into two differently-framed "shots" so
// it doesn't read as one static image. Free, local, uses ffmpeg only.
//
// Usage: node make_reel.js --config path/to/reel.json
//
// reel.json shape:
// {
//   "title": "Spring Retreat 2026",            // optional opening title card
//   "outro": "Link in bio to book your spot",  // optional closing CTA card
//   "brandColor": "#1f3d2e",                   // optional title/outro card background
//   "secondsEach": 2.6,                        // default duration per shot
//   "images": [
//     "photos/retreat1.jpg",
//     { "file": "clips/sunrise-flow.mp4", "caption": "Sunrise flow" },
//     { "file": "photos/retreat2.jpg", "seconds": 3 }
//   ],
//   "music": "music/calm-loop.mp3",            // optional
//   "output": "out/retreat-reel.mp4"
// }

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function run(args) {
  console.log("ffmpeg " + args.join(" "));
  execFileSync("ffmpeg", args, { stdio: "inherit" });
}

// Makes a Windows path safe to embed inside an ffmpeg filtergraph string
// (forward slashes, escaped drive-letter colon).
function ffPath(p) {
  return path.resolve(p).replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
}

const VIDEO_EXT = new Set([".mp4", ".mov", ".m4v", ".avi", ".webm"]);
// Windows locally, DejaVu Sans Bold on the Linux runner GitHub Actions uses
// (installed via `apt-get install fonts-dejavu-core` in the workflow).
const FONT_BOLD =
  process.platform === "win32"
    ? "C:/Windows/Fonts/arialbd.ttf"
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";

const configIdx = process.argv.indexOf("--config");
const configPath = configIdx >= 0 ? process.argv[configIdx + 1] : null;
if (!configPath) {
  console.error("Usage: node make_reel.js --config reel.json");
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
if (!cfg.images || cfg.images.length === 0) {
  console.error("reel.json must list at least one image/video in 'images'");
  process.exit(1);
}

const secondsEach = cfg.secondsEach ?? 2.6;
const fps = 30;
// True 4K vertical. Instagram itself will downscale to 1080x1920 on upload —
// this resolution is for a full-quality download/archive of the reel.
const W = 2160;
const H = 3840;
const SCALE = W / 1080; // all pixel constants below are authored at 1080-wide and scaled up
const fadeDur = 0.35;
const cardDur = 1.8;
const brandColor = cfg.brandColor ?? "#1f3d2e";
const outDir = path.dirname(cfg.output);
fs.mkdirSync(outDir, { recursive: true });

const tmpDir = fs.mkdtempSync(path.join(outDir, ".reel-"));
let textFileCount = 0;

// Writes `text` to a temp file and returns a drawtext filter fragment that reads
// from it — avoids fragile escaping of apostrophes/colons in on-screen copy. Fades
// in over the first 0.35s instead of popping on, so it reads as animated, not static.
// `fontsize`/`y` are authored as if W were 1080 and scaled internally, so callers
// don't need to think about the actual render resolution.
function captionFilter(text, { fontsize = 56, y = `h-${Math.round(420 * SCALE)}` } = {}) {
  const file = path.join(tmpDir, `text${textFileCount++}.txt`);
  fs.writeFileSync(file, text, "utf8");
  return (
    `drawtext=fontfile='${ffPath(FONT_BOLD)}':textfile='${ffPath(file)}':` +
    `fontcolor=white:fontsize=${Math.round(fontsize * SCALE)}:line_spacing=${Math.round(10 * SCALE)}:` +
    `x=(w-text_w)/2:y=${y}:box=1:boxcolor=black@0.45:boxborderw=${Math.round(24 * SCALE)}:` +
    `alpha='if(lt(t,0.35),t/0.35,1)'`
  );
}

// Four push-in + pan directions, cycled per shot so consecutive images (or the two
// auto-generated shots from a single photo) don't move the same way.
const PAN_VARIANTS = [
  { x: "(iw-iw/zoom)*(on/{F})", y: "(ih-ih/zoom)/2" }, // push in, drift left -> right
  { x: "(iw-iw/zoom)*(1-on/{F})", y: "(ih-ih/zoom)/2" }, // push in, drift right -> left
  { x: "(iw-iw/zoom)/2", y: "(ih-ih/zoom)*(on/{F})" }, // push in, drift top -> bottom
  { x: "(iw-iw/zoom)/2", y: "(ih-ih/zoom)*(1-on/{F})" }, // push in, drift bottom -> top
];

function kenBurnsFilter(duration, variantIndex) {
  const frames = Math.round(duration * fps);
  const lastFrame = Math.max(1, frames - 1);
  const variant = PAN_VARIANTS[variantIndex % PAN_VARIANTS.length];
  const zExpr = `1+0.22*on/${lastFrame}`;
  const x = variant.x.replace("{F}", String(lastFrame));
  const y = variant.y.replace("{F}", String(lastFrame));
  return (
    `scale=${Math.round(W * 1.3)}:${Math.round(H * 1.3)}:force_original_aspect_ratio=increase,` +
    `crop=${Math.round(W * 1.3)}:${Math.round(H * 1.3)},` +
    `zoompan=z='${zExpr}':x='${x}':y='${y}':d=${frames}:s=${W}x${H}:fps=${fps}`
  );
}

// A single photo with no companion shots reads as one static image for the whole
// reel — split it into two differently-framed "shots" (different pan direction and
// a slightly tighter second crop) so there's visible motion/variety even with only
// one source photo.
function expandShots(images) {
  if (images.length !== 1) return images;
  const only = typeof images[0] === "string" ? { file: images[0] } : images[0];
  if (VIDEO_EXT.has(path.extname(only.file).toLowerCase())) return images;
  const half = (only.seconds ?? secondsEach) * 0.75;
  return [
    { file: only.file, seconds: half, caption: only.caption },
    { file: only.file, seconds: half },
  ];
}

try {
  const clips = [];

  // 0. Title card.
  if (cfg.title) {
    const out = path.join(tmpDir, "title.mp4");
    run([
      "-y",
      "-f", "lavfi",
      "-i", `color=c=${brandColor}:s=${W}x${H}:d=${cardDur}:r=${fps}`,
      "-vf", captionFilter(cfg.title, { fontsize: 72, y: "(h-text_h)/2" }),
      "-pix_fmt", "yuv420p",
      out,
    ]);
    clips.push({ file: out, duration: cardDur });
  }

  // 1. Turn each photo/video into a clip: directional push-in for photos, cover-crop
  // for video. Consecutive photo shots cycle through different pan directions.
  const images = expandShots(cfg.images);
  images.forEach((item, i) => {
    const entry = typeof item === "string" ? { file: item } : item;
    const duration = entry.seconds ?? secondsEach;
    const isVideo = VIDEO_EXT.has(path.extname(entry.file).toLowerCase());
    const out = path.join(tmpDir, `clip${i}.mp4`);
    const captionVf = entry.caption ? "," + captionFilter(entry.caption) : "";

    if (isVideo) {
      run([
        "-y",
        "-i", entry.file,
        "-vf", `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${fps}${captionVf}`,
        "-t", String(duration),
        "-an",
        "-pix_fmt", "yuv420p",
        out,
      ]);
    } else {
      run([
        "-y",
        "-loop", "1",
        "-i", entry.file,
        "-vf", kenBurnsFilter(duration, i) + captionVf,
        "-t", String(duration),
        "-pix_fmt", "yuv420p",
        out,
      ]);
    }
    clips.push({ file: out, duration });
  });

  // 2. Outro CTA card.
  if (cfg.outro) {
    const out = path.join(tmpDir, "outro.mp4");
    run([
      "-y",
      "-f", "lavfi",
      "-i", `color=c=${brandColor}:s=${W}x${H}:d=${cardDur}:r=${fps}`,
      "-vf", captionFilter(cfg.outro, { fontsize: 60, y: "(h-text_h)/2" }),
      "-pix_fmt", "yuv420p",
      out,
    ]);
    clips.push({ file: out, duration: cardDur });
  }

  // 3. Chain every clip together with a snappy crossfade between each pair.
  let current = clips[0].file;
  let currentDuration = clips[0].duration;
  for (let i = 1; i < clips.length; i++) {
    const next = clips[i];
    const merged = path.join(tmpDir, `merge${i}.mp4`);
    const offset = currentDuration - fadeDur;
    run([
      "-y",
      "-i", current,
      "-i", next.file,
      "-filter_complex", `xfade=transition=fade:duration=${fadeDur}:offset=${offset}`,
      "-pix_fmt", "yuv420p",
      merged,
    ]);
    current = merged;
    currentDuration = currentDuration + next.duration - fadeDur;
  }

  // 4. Cinematic color grade + clean fade in/out from black.
  const graded = path.join(tmpDir, "graded.mp4");
  run([
    "-y",
    "-i", current,
    "-vf",
    `eq=contrast=1.08:saturation=1.18:brightness=0.02,vignette=PI/6,` +
      `fade=t=in:st=0:d=0.3,fade=t=out:st=${Math.max(0, currentDuration - 0.3).toFixed(2)}:d=0.3`,
    "-pix_fmt", "yuv420p",
    "-c:v", "libx264",
    graded,
  ]);
  current = graded;

  // 5. Optionally lay a music track under the finished video, trimmed to length.
  if (cfg.music) {
    run([
      "-y",
      "-i", current,
      "-i", cfg.music,
      "-filter_complex", "[1:a]volume=0.55,afade=t=in:st=0:d=0.4,afade=t=out:st=" +
        Math.max(0, currentDuration - 0.7).toFixed(2) + ":d=0.7[aud]",
      "-map", "0:v",
      "-map", "[aud]",
      "-shortest",
      "-c:v", "libx264",
      "-c:a", "aac",
      cfg.output,
    ]);
  } else {
    fs.copyFileSync(current, cfg.output);
  }

  console.log(`\nReel written to ${cfg.output}`);
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
