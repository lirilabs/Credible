export const config = { runtime: "nodejs" };

import crypto from "crypto";
import { readFile, writeFile } from "../_lib/github.js";

/* ---------------- ENV ---------------- */
function getEnv() {
  return {
    SECRET_KEY: process.env.SECRET_KEY
  };
}

/* ---------------- CRYPTO ---------------- */
function getKey() {
  const { SECRET_KEY } = getEnv();
  if (!SECRET_KEY) throw new Error("SECRET_KEY missing");
  return crypto.createHash("sha256").update(SECRET_KEY).digest();
}

function encryptField(value) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decryptField(value) {
  if (!value) return null;
  const buf = Buffer.from(value, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const content = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(content),
    decipher.final()
  ]).toString("utf8");
}

/* ---------------- HELPERS ---------------- */
async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
}

const FILE = "posts.json";

/* ---------------- API ---------------- */
export default async function handler(req, res) {
  try {
    const { action } = req.query || {};
    const { content, sha } = await readFile(FILE);
    const posts = content ? JSON.parse(content) : [];

    if (!action) {
      return res.json({
        ok: true,
        actions: ["ping", "posts", "addPost", "like", "comment"]
      });
    }

    if (action === "ping") {
      return res.json({ ok: true, ts: Date.now() });
    }

    if (action === "posts") {
      const visible = posts.map(p => ({
        id: p.id,
        createdAt: p.createdAt,
        text: decryptField(p.encrypted.text),
        image: decryptField(p.encrypted.image),
        likes: p.likes,
        comments: p.comments
      }));
      return res.json(visible);
    }

    if (action === "addPost") {
      const body = await readBody(req);

      const post = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),

        encrypted: {
          text: encryptField(body.text || ""),
          image: encryptField(body.image || null)
        },

        likes: { count: 0, users: {} },
        comments: [],
        version: 1
      };

      posts.unshift(post);
      await writeFile(FILE, JSON.stringify(posts), sha);
      return res.json({ ok: true, postId: post.id });
    }

    if (action === "like") {
      const body = await readBody(req);
      const post = posts.find(p => p.id === body.postId);
      if (!post) return res.status(404).json({ error: "POST_NOT_FOUND" });

      if (!post.likes.users[body.uid]) {
        post.likes.users[body.uid] = true;
        post.likes.count++;
        post.version++;
      }

      await writeFile(FILE, JSON.stringify(posts), sha);
      return res.json(post.likes);
    }

    if (action === "comment") {
      const body = await readBody(req);
      const post = posts.find(p => p.id === body.postId);
      if (!post) return res.status(404).json({ error: "POST_NOT_FOUND" });

      post.comments.push({
        id: crypto.randomUUID(),
        uid: body.uid,
        text: body.text,
        ts: Date.now()
      });

      post.version++;
      await writeFile(FILE, JSON.stringify(posts), sha);
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: "INVALID_ACTION" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
