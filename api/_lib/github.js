import crypto from "crypto";
import fetch from "node-fetch";
import { normalizePost } from "./response.js";

const {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH,
  GITHUB_TOKEN
} = process.env;

const GH = "https://api.github.com";

function headers() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json"
  };
}

function toBase64(obj) {
  return Buffer.from(JSON.stringify(obj, null, 2)).toString("base64");
}

async function getAllPostFiles() {
  const root = await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`,
    { headers: headers() }
  ).then(r => r.json());

  const files = [];

  for (const dir of root || []) {
    if (dir.type !== "dir") continue;
    const list = await fetch(dir.url, { headers: headers() }).then(r => r.json());
    for (const f of list || []) files.push(f);
  }

  return files;
}

/* ---------------- CREATE POST ---------------- */

export async function createPost(body) {
  const id = crypto.randomUUID();
  const ts = Date.now();

  const post = {
    id,
    userId: body.userId,
    text: body.text,
    tags: body.tags || [],
    image: body.image || null,
    ts,
    comments: [],
    points: []
  };

  const ym = new Date(ts).toISOString().slice(0, 7);
  const path = `posts/${ym}/${id}.json`;

  await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `post ${id}`,
        content: toBase64(post),
        branch: GITHUB_BRANCH
      })
    }
  );

  return { ok: true, id };
}

/* ---------------- LIST POSTS ---------------- */

export async function listPosts() {
  const out = [];
  const files = await getAllPostFiles();

  for (const f of files) {
    if (!f.download_url) continue;
    try {
      const p = await fetch(f.download_url).then(r => r.json());
      out.push(normalizePost(p));
    } catch {}
  }

  return out;
}

/* ---------------- ADD COMMENT (FIXED) ---------------- */

export async function addComment({ postId, userId, text }) {
  const files = await getAllPostFiles();

  for (const f of files) {
    const post = await fetch(f.download_url).then(r => r.json());
    if (post.id !== postId) continue;

    const fixed = normalizePost(post);
    fixed.comments.push({ userId, text, ts: Date.now() });

    await fetch(f.url, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `comment ${postId}`,
        content: toBase64(fixed),
        sha: f.sha,
        branch: GITHUB_BRANCH
      })
    });

    return { ok: true };
  }

  throw new Error("Post not found");
}

/* ---------------- ADD POINT (FIXED) ---------------- */

export async function addPoint({ postId, userId }) {
  const files = await getAllPostFiles();

  for (const f of files) {
    const post = await fetch(f.download_url).then(r => r.json());
    if (post.id !== postId) continue;

    const fixed = normalizePost(post);

    if (fixed.points.some(p => p.userId === userId)) {
      return { ok: true, skipped: true };
    }

    fixed.points.push({ userId, ts: Date.now() });

    await fetch(f.url, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `point ${postId}`,
        content: toBase64(fixed),
        sha: f.sha,
        branch: GITHUB_BRANCH
      })
    });

    return { ok: true };
  }

  throw new Error("Post not found");
}
