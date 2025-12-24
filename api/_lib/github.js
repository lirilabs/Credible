import crypto from "crypto";
import fetch from "node-fetch";
import { ENV } from "./env.js";

const GH = "https://api.github.com";

const headers = () => ({
  Authorization: `Bearer ${ENV.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "Cache-Control": "no-cache",
  Pragma: "no-cache"
});

const toBase64 = obj =>
  Buffer.from(JSON.stringify(obj, null, 2)).toString("base64");

function yearMonth(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ---------- CREATE ---------- */

export async function createPost(body) {
  const ts = Date.now();
  const id = crypto.randomUUID();

  const post = {
    id,
    userId: body.userId,
    text: body.text,
    image: body.image || null,
    tags: body.tags || [],
    comments: [],
    points: [],
    ts
  };

  const path = `posts/${yearMonth(ts)}/${id}.json`;

  await fetch(`${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      message: `post ${id}`,
      content: toBase64(post),
      branch: ENV.GITHUB_BRANCH
    })
  });

  return { ok: true, id };
}

/* ---------- READ (LIVE) ---------- */

export async function listPosts() {
  const out = [];

  const root = await fetch(
    `${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/posts?ref=${ENV.GITHUB_BRANCH}`,
    { headers: headers() }
  ).then(r => r.ok ? r.json() : []);

  for (const dir of root) {
    if (dir.type !== "dir") continue;

    const files = await fetch(dir.url, { headers: headers() })
      .then(r => r.ok ? r.json() : []);

    for (const f of files) {
      if (!f.download_url) continue;

      const post = await fetch(`${f.download_url}?t=${Date.now()}`)
        .then(r => r.json());

      // 🔒 BACKWARD COMPATIBILITY
      post.comments ||= [];
      post.points ||= [];

      out.push(post);
    }
  }

  return out;
}
