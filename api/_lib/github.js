import fetch from "node-fetch";
import crypto from "crypto";
import { ENV } from "./env.js";
import { encrypt } from "./crypto.js";

const API = "https://api.github.com";

const headers = () => ({
  Authorization: `Bearer ${ENV.GITHUB_TOKEN}`,
  "User-Agent": "credible-serverless"
});

/* ---------- CREATE ---------- */
export async function createPost({ userId, text, imageRef, tags }) {
  const id = crypto.randomUUID();
  const month = new Date().toISOString().slice(0, 7);

  const post = {
    id,
    userId,
    text: encrypt(text),
    image: encrypt(imageRef),
    tags,
    ts: Date.now()
  };

  const path = `data/posts/${month}/${id}.json`;

  await writeFile(path, post);
  return { id };
}

/* ---------- READ (ALL) ---------- */
export async function listPosts() {
  const base = `${API}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/data/posts`;
  const res = await fetch(base, { headers: headers() });
  if (!res.ok) return [];

  const months = await res.json();
  if (!Array.isArray(months)) return [];

  const posts = [];

  for (const m of months) {
    const r = await fetch(m.url, { headers: headers() });
    if (!r.ok) continue;

    const files = await r.json();
    if (Array.isArray(files)) posts.push(...files);
  }

  return posts;
}

/* ---------- UPDATE ---------- */
export async function updatePost({ path, sha, newData }) {
  await fetch(
    `${API}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: "db:update",
        content: Buffer.from(JSON.stringify(newData)).toString("base64"),
        sha,
        branch: ENV.GITHUB_BRANCH
      })
    }
  );
}

/* ---------- DELETE ---------- */
export async function deletePost({ path, sha }) {
  await fetch(
    `${API}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}`,
    {
      method: "DELETE",
      headers: headers(),
      body: JSON.stringify({
        message: "db:delete",
        sha,
        branch: ENV.GITHUB_BRANCH
      })
    }
  );
}

/* ---------- helper ---------- */
async function writeFile(path, content) {
  await fetch(
    `${API}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: "db:create",
        content: Buffer.from(JSON.stringify(content)).toString("base64"),
        branch: ENV.GITHUB_BRANCH
      })
    }
  );
}
