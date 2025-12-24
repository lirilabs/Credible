export const config = { runtime: "nodejs" };

import crypto from "crypto";

/* ------------------ helpers ------------------ */

function getEnv() {
  return {
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_BRANCH: process.env.GITHUB_BRANCH || "main",
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    SECRET_KEY: process.env.SECRET_KEY
  };
}

function getCryptoKey() {
  const { SECRET_KEY } = getEnv();
  if (!SECRET_KEY) throw new Error("SECRET_KEY missing");
  return crypto.createHash("sha256").update(SECRET_KEY).digest();
}

function encrypt(data) {
  const key = getCryptoKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const enc = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decrypt(payload) {
  if (!payload) return [];
  const key = getCryptoKey();

  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const content = buf.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return JSON.parse(
    Buffer.concat([decipher.update(content), decipher.final()]).toString("utf8")
  );
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString());
}

/* ------------------ GitHub storage ------------------ */

const FILE = "posts.enc";

async function readFromGitHub() {
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, GITHUB_TOKEN } = getEnv();

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE}?ref=${GITHUB_BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "User-Agent": "vercel"
      }
    }
  );

  if (res.status === 404) {
    return { posts: [], sha: null };
  }

  const json = await res.json();
  const raw = Buffer.from(json.content, "base64").toString();
  return { posts: decrypt(raw), sha: json.sha };
}

async function writeToGitHub(posts, sha) {
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, GITHUB_TOKEN } = getEnv();

  await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "vercel"
      },
      body: JSON.stringify({
        message: "update posts",
        content: Buffer.from(encrypt(posts)).toString("base64"),
        sha,
        branch: GITHUB_BRANCH
      })
    }
  );
}

/* ------------------ API handler ------------------ */

export default async function handler(req, res) {
  try {
    const { action } = req.query || {};

    if (!action) {
      return res.json({
        ok: true,
        actions: ["ping", "posts", "addPost"]
      });
    }

    if (action === "ping") {
      return res.json({ ok: true, ts: Date.now() });
    }

    if (action === "posts") {
      const { posts } = await readFromGitHub();
      return res.json(posts);
    }

    if (action === "addPost") {
      const body = await readBody(req);
      const { posts, sha } = await readFromGitHub();

      const post = {
        id: crypto.randomUUID(),
        title: body.title || "",
        text: body.text || "",
        image: body.image || null,
        likes: { count: 0, users: {} },
        comments: [],
        createdAt: Date.now()
      };

      posts.unshift(post);
      await writeToGitHub(posts, sha);

      return res.json({ ok: true, post });
    }

    return res.status(400).json({ error: "INVALID_ACTION" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
