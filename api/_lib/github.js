import crypto from "crypto";
import fetch from "node-fetch";

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
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json"
  };
}

function toBase64(obj) {
  return Buffer.from(JSON.stringify(obj, null, 2)).toString("base64");
}

function yearMonth(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ================= NORMALIZE (CRITICAL) ================= */

function normalizePost(p) {
  return {
    ...p,
    comments: Array.isArray(p.comments) ? p.comments : [],
    points: Array.isArray(p.points) ? p.points : [],
    updatedAt: p.updatedAt || p.ts
  };
}

/* ================= LOAD ALL POSTS ================= */

async function loadAllPosts() {
  const out = [];

  const root = await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`,
    { headers: headers() }
  );

  if (!root.ok) return [];

  const folders = await root.json();
  if (!Array.isArray(folders)) return [];

  for (const dir of folders) {
    if (dir.type !== "dir") continue;

    const files = await fetch(dir.url, { headers: headers() }).then(r => r.json());

    for (const f of files) {
      if (!f.download_url) continue;
      try {
        const post = await fetch(f.download_url).then(r => r.json());
        out.push(normalizePost(post));
      } catch {}
    }
  }

  return out;
}

/* ================= CREATE POST ================= */

export async function createPost(body) {
  const ts = Date.now();
  const id = crypto.randomUUID();

  const post = normalizePost({
    id,
    userId: body.userId,
    text: body.text,
    tags: Array.isArray(body.tags) ? body.tags : [],
    image: body.image || null,
    ts,
    updatedAt: ts
  });

  const path = `posts/${yearMonth(ts)}/${id}.json`;

  const res = await fetch(
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

  if (!res.ok) throw new Error("Create failed");
  return { ok: true, id };
}

/* ================= LIST POSTS (REALTIME) ================= */

export async function listPosts(since = 0) {
  const posts = await loadAllPosts();
  return posts.filter(p => (p.updatedAt || p.ts) > since);
}

/* ================= ADD COMMENT ================= */

export async function addComment({ postId, userId, text }) {
  const posts = await loadAllPosts();

  for (let post of posts) {
    if (post.id !== postId) continue;

    post = normalizePost(post);

    post.comments.push({
      id: crypto.randomUUID(),
      userId,
      text,
      ts: Date.now()
    });

    post.updatedAt = Date.now();
    return savePost(post);
  }

  throw new Error("Post not found");
}

/* ================= ADD POINT ================= */

export async function addPoint({ postId, userId }) {
  const posts = await loadAllPosts();

  for (let post of posts) {
    if (post.id !== postId) continue;

    post = normalizePost(post);

    if (!post.points.includes(userId)) {
      post.points.push(userId);
      post.updatedAt = Date.now();
    }

    return savePost(post);
  }

  throw new Error("Post not found");
}

/* ================= SAVE POST ================= */

async function savePost(post) {
  const folder = yearMonth(post.ts);
  const path = `posts/${folder}/${post.id}.json`;

  const meta = await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`,
    { headers: headers() }
  ).then(r => r.json());

  const res = await fetch(meta.url, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      message: `update ${post.id}`,
      content: toBase64(post),
      sha: meta.sha,
      branch: GITHUB_BRANCH
    })
  });

  if (!res.ok) throw new Error("Save failed");
  return { ok: true };
}
