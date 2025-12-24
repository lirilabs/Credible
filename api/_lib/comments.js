import crypto from "crypto";
import { ENV } from "./env.js";

/* ---------------- HELPERS ---------------- */

const GH = "https://api.github.com";

const headers = () => ({
  Authorization: `Bearer ${ENV.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
});

const toBase64 = obj =>
  Buffer.from(JSON.stringify(obj, null, 2)).toString("base64");

const yearMonth = ts => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
};

/* ---------------- ADD COMMENT ---------------- */

export async function addComment({
  postId,
  postOwnerId,
  userId,
  text,
}) {
  if (!postId || !userId || !text) {
    throw new Error("postId, userId and text are required");
  }

  const ts = Date.now();
  const id = crypto.randomUUID();

  const comment = {
    id,
    postId,
    userId,
    text,
    ts,
  };

  const folder = yearMonth(ts);
  const path = `comments/${postId}/${folder}/${id}.json`;

  const res = await fetch(
    `${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `comment ${id}`,
        content: toBase64(comment),
        branch: ENV.GITHUB_BRANCH,
      }),
    }
  );

  if (!res.ok) throw new Error("Comment create failed");

  /* ---------------- POINT SYSTEM ----------------
     +2 points for post owner when someone comments
  ------------------------------------------------ */
  if (postOwnerId && postOwnerId !== userId) {
    await addPoints(postOwnerId, 2);
  }

  return { ok: true, id };
}

/* ---------------- POINT STORAGE ---------------- */

async function addPoints(userId, delta) {
  const path = `points/${userId}.json`;

  // Try to read existing
  let current = { userId, points: 0 };

  try {
    const res = await fetch(
      `${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}?ref=${ENV.GITHUB_BRANCH}`,
      { headers: headers() }
    );

    if (res.ok) {
      const json = await res.json();
      current = JSON.parse(
        Buffer.from(json.content, "base64").toString()
      );
    }
  } catch {}

  current.points += delta;
  current.updatedAt = Date.now();

  await fetch(
    `${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `points update ${userId}`,
        content: toBase64(current),
        branch: ENV.GITHUB_BRANCH,
      }),
    }
  );
}
