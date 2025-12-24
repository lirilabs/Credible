import crypto from "crypto";
import fetch from "node-fetch";

const {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH,
  GITHUB_TOKEN
} = process.env;

const GH = "https://api.github.com";

/* ---------------- HELPERS ---------------- */

function headers() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json"
  };
}

function toBase64(obj) {
  return Buffer.from(JSON.stringify(obj, null, 2)).toString("base64");
}

function normalizePost(post) {
  if (!Array.isArray(post.comments)) post.comments = [];
  if (!Array.isArray(post.points)) post.points = [];
  if (!Array.isArray(post.tags)) post.tags = [];
  return post;
}

async function getAllPostFiles() {
  const root = await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`,
    { headers: headers() }
  ).then(r => r.json());

  const files = [];

  for (const dir of root || []) {
    if (dir.type !== "dir") continue;
    const f = await fetch(dir.url, { headers: headers() }).then(r => r.json());
    files.push(...f);
  }

  return files;
}

/* ---------------- CREATE POST ---------------- */

export async function createPost({ userId, text, tags = [], image = null }) {
  const id = crypto.randomUUID();
  const ts = Date.now();

  const post = normalizePost({
    id,
    userId,
    text,
    tags,
    image,
    ts
  });

  const folder = new Date(ts).toISOString().slice(0, 7);
  const path = `posts/${folder}/${id}.json`;

  await fetch(`${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      message: `post ${id}`,
      content: toBase64(post),
      branch: GITHUB_BRANCH
    })
  });

  return { ok: true, id };
}

/* ---------------- LIST POSTS ---------------- */

export async function listPosts() {
  const files = await getAllPostFiles();
  const out = [];

  for (const f of files) {
    if (!f.download_url) continue;
    try {
      let post = await fetch(f.download_url).then(r => r.json());
      post = normalizePost(post);
      out.push(post);
    } catch {}
  }

  return out;
}

/* ---------------- ADD COMMENT ---------------- */

export async function addComment({ postId, userId, text }) {
  const files = await getAllPostFiles();

  for (const f of files) {
    if (!f.name.startsWith(postId)) continue;

    let post = await fetch(f.download_url).then(r => r.json());
    post = normalizePost(post);

    post.comments.push({
      userId,
      text,
      ts: Date.now()
    });

    await fetch(f.url, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `comment ${postId}`,
        content: toBase64(post),
        sha: f.sha,
        branch: GITHUB_BRANCH
      })
    });

    return { ok: true };
  }

  throw new Error("Post not found");
}

/* ---------------- ADD POINT ---------------- */

export async function addPoint({ postId, userId }) {
  const files = await getAllPostFiles();

  for (const f of files) {
    if (!f.name.startsWith(postId)) continue;

    let post = await fetch(f.download_url).then(r => r.json());
    post = normalizePost(post);

    // prevent double voting
    if (post.points.some(p => p.userId === userId)) {
      return { ok: true, skipped: true };
    }

    post.points.push({
      userId,
      ts: Date.now()
    });

    await fetch(f.url, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `point ${postId}`,
        content: toBase64(post),
        sha: f.sha,
        branch: GITHUB_BRANCH
      })
    });

    return { ok: true };
  }

  throw new Error("Post not found");
}
