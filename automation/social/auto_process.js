// Runs on a GitHub Actions schedule (see ../../.github/workflows/social-auto-draft.yml).
// Finds every 'new' campaign in the Social Media & Marketing queue, downloads its
// photos, builds a Reel with make_reel.js, writes a template caption, uploads the
// result to Supabase storage, and marks the campaign 'drafted'. Nothing posts
// anywhere from here — that still waits for a human Approve in the app.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const MUSIC_PATH = path.join(import.meta.dirname, "music", "that-zen-moment.mp3");
const MUSIC_CREDIT = 'Music: "That Zen Moment" by Kevin MacLeod (incompetech.com), CC BY 4.0 — credit required if posted publicly.';

function headers(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

async function getNewCampaigns() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/social_campaigns?status=eq.new&select=*`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`List failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
}

async function uploadToBucket(localPath, remotePath, contentType) {
  const buf = fs.readFileSync(localPath);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/social-media/${remotePath}`, {
    method: "POST",
    headers: headers({ "Content-Type": contentType, "x-upsert": "true" }),
    body: buf,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/social-media/${remotePath}`;
}

async function updateCampaign(id, fields) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/social_campaigns?id=eq.${id}`, {
    method: "PATCH",
    headers: headers({ "Content-Type": "application/json", Prefer: "return=minimal" }),
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status} ${await res.text()}`);
}

const STOPWORDS = new Set([
  "this", "that", "with", "from", "will", "have", "your", "about", "into", "they",
  "them", "there", "their", "been", "were", "what", "when", "where", "which", "while",
]);

function deriveHashtags(text) {
  const words = (text.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => !STOPWORDS.has(w));
  const unique = [...new Set(words)].slice(0, 4).map((w) => `#${w}`);
  return ["#yogaretreat", "#yogaeverydamnday", ...unique];
}

function buildCaption(campaign) {
  const hook = `✨ ${campaign.title}`;
  const body = campaign.context.trim();
  const cta = "Link in bio to learn more and reserve your spot.";
  const hashtags = deriveHashtags(`${campaign.title} ${campaign.context}`).join(" ");
  return `${hook}\n\n${body}\n\n${cta}\n\n${hashtags}`;
}

async function processCampaign(campaign) {
  console.log(`Processing "${campaign.title}" (${campaign.id})...`);
  const workDir = path.join("out", `campaign-${campaign.id}`);
  fs.mkdirSync(workDir, { recursive: true });

  const localImages = [];
  for (let i = 0; i < campaign.image_urls.length; i++) {
    const url = campaign.image_urls[i];
    const ext = path.extname(new URL(url).pathname) || ".jpg";
    const dest = path.join(workDir, `img${i}${ext}`);
    await downloadFile(url, dest);
    localImages.push(dest);
  }

  const hasMusic = fs.existsSync(MUSIC_PATH);
  const reelConfig = {
    title: campaign.title,
    outro: "Link in bio to learn more",
    brandColor: "#1f3d2e",
    secondsEach: 2.6,
    images: localImages,
    music: hasMusic ? MUSIC_PATH : undefined,
    output: path.join(workDir, "reel.mp4"),
  };
  const reelConfigPath = path.join(workDir, "reel.json");
  fs.writeFileSync(reelConfigPath, JSON.stringify(reelConfig, null, 2));

  execFileSync("node", [path.join(import.meta.dirname, "make_reel.js"), "--config", reelConfigPath], {
    stdio: "inherit",
  });

  const reelUrl = await uploadToBucket(reelConfig.output, `${campaign.id}/reel-${Date.now()}.mp4`, "video/mp4");

  await updateCampaign(campaign.id, {
    caption: buildCaption(campaign),
    reel_url: reelUrl,
    status: "drafted",
    notes: hasMusic ? MUSIC_CREDIT : null,
    updated_at: new Date().toISOString(),
  });

  console.log(`Drafted "${campaign.title}".`);
}

const campaigns = await getNewCampaigns();
if (campaigns.length === 0) {
  console.log("No new campaigns to draft.");
} else {
  for (const campaign of campaigns) {
    try {
      await processCampaign(campaign);
    } catch (err) {
      console.error(`Failed to process ${campaign.id}:`, err);
    }
  }
}
