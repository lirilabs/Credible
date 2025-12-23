import fetch from "node-fetch";
import { encrypt } from "./crypto";
import { setCache, getCache } from "./cache";

const API = "https://api.github.com";

export async function createPost(payload) {
  const encrypted = encrypt(payload.text);
  const post = {
    id: crypto.randomUUID(),
    userId: payload.userId,
    text: encrypted,
    image: encrypt(payload.imageRef),
    tags: payload.tags,
    ts: Date.now(),
  };

  const path = `data/posts/${new Date().toISOString().slice(0, 7)}/${post.id}.json`;

  await githubWrite(path, post);
  setCache("posts", null); // invalidate

  return { id: post.id };
}

export async function listPosts() {
  const cached = getCache("posts");
  if (cached) return cached;

  const files = await githubReadDir("data/posts");
  setCache("posts", files, 60000);

  return files;
}

/* ---------- helpers ---------- */

async function githubWrite(path, content) {
  const url = `${API}/repos/${process.env.GITHUB_REPO}/contents/${path}`;

  await fetch(url, {
    method: "PUT",
    headers: auth(),
    body: JSON.stringify({
      message: `add ${path}`,
      content: Buffer.from(JSON.stringify(content)).toString("base64"),
      branch: process.env.GITHUB_BRANCH,
    }),
  });
}

async function githubReadDir(path) {
  const url = `${API}/repos/${process.env.GITHUB_REPO}/contents/${path}`;
  const res = await fetch(url, { headers: auth() });
  return await res.json();
}

function auth() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    "User-Agent": "trust-graph",
  };
}
