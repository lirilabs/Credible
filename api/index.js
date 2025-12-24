export const config = { runtime: "nodejs" };

import crypto from "crypto";
import { readFile, writeFile } from "../_lib/github.js";

/* ---------- helpers ---------- */

function safeId() {
  return crypto.randomBytes(16).toString("hex");
}

function getKey() {
  if (!process.env.SECRET_KEY) {
    throw new Error("SECRET_KEY missing");
  }
  return crypto.createHash("sha256").update(process.env.SECRET_KEY).digest();
}

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decrypt(payload) {
  if (!payload) return null;
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(data),
    decipher.final()
  ]).toString("utf8");
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString());
}

/* ---------- API ---------- */

const FILE = "posts.json";

export default async function handler(req, res) {
  try {
    const { action } = req.query || {};

    const file = await readFile(FILE);

    let posts = [];
    try {
      posts = JSON.parse(file.content);
      if (!Array.isArray(posts)) posts = [];
    } catch {
      posts = [];
    }

    if (!action) {
      return res.json({
        ok: true,
        actions: ["ping", "posts", "addPost", "like", "comment", "editPost", "deletePost"]
      });
    }

    if (action === "ping") {
      return res.json({ ok: true, ts: Date.now() });
    }

    if (action === "posts") {
      return res.json(
        posts.map(p => ({
          id: p.id,
          createdAt: p.createdAt,
          text: decrypt(p.encrypted.text),
          image: decrypt(p.encrypted.image),
          likes: p.likes,
          comments: p.comments
        }))
      );
    }

    const body = await readBody(req);

    if (action === "addPost") {
      const post = {
        id: safeId(),
        createdAt: Date.now(),
        encrypted: {
          text: encrypt(body.text || ""),
          image: encrypt(body.image || null)
        },
        likes: { count: 0, users: {} },
        comments: [],
        version: 1
      };

      posts.unshift(post);
      await writeFile(FILE, JSON.stringify(posts), file.sha);
      return res.json({ ok: true });
    }

    if (action === "like") {
      const post = posts.find(p => p.id === body.postId);
      if (!post) return res.status(404).json({ error: "POST_NOT_FOUND" });

      if (!post.likes.users[body.uid]) {
        post.likes.users[body.uid] = true;
        post.likes.count++;
      }

      await writeFile(FILE, JSON.stringify(posts), file.sha);
      return res.json(post.likes);
    }

    if (action === "comment") {
      const post = posts.find(p => p.id === body.postId);
      if (!post) return res.status(404).json({ error: "POST_NOT_FOUND" });

      post.comments.push({
        id: safeId(),
        uid: body.uid,
        text: body.text,
        ts: Date.now()
      });

      await writeFile(FILE, JSON.stringify(posts), file.sha);
      return res.json({ ok: true });
    }

    if (action === "editPost") {
      const post = posts.find(p => p.id === body.postId);
      if (!post) return res.status(404).json({ error: "POST_NOT_FOUND" });

      post.encrypted.text = encrypt(body.text);
      await writeFile(FILE, JSON.stringify(posts), file.sha);
      return res.json({ ok: true });
    }

    if (action === "deletePost") {
      const filtered = posts.filter(p => p.id !== body.postId);
      await writeFile(FILE, JSON.stringify(filtered), file.sha);
      return res.json({ ok: true });
    }

    res.status(400).json({ error: "INVALID_ACTION" });

  } catch (e) {
    console.error("SERVER ERROR:", e);
    res.status(500).json({ error: e.message });
  }
}
