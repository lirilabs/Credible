import crypto from "crypto";
import fetch from "node-fetch";
import { ENV } from "./env.js";

const GH = "https://api.github.com";

/* ======================================================
   HELPERS
====================================================== */

const headers = () => ({
  Authorization: `Bearer ${ENV.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
});

const toBase64 = obj =>
  Buffer.from(JSON.stringify(obj, null, 2)).toString("base64");

/* ======================================================
   ADD POINT TO POST (EVENT BASED)
====================================================== */

export async function addPoint({ postId, postOwnerId, userId }) {
  if (!postId || !postOwnerId || !userId) {
    throw new Error("postId, postOwnerId, userId required");
  }

  // ❌ Prevent self-vote
  if (postOwnerId === userId) {
    throw new Error("Cannot upvote your own post");
  }

  const ts = Date.now();
  const pointId = crypto.randomUUID();

  /* ---------------- ONE USER = ONE FILE ---------------- */

  const pointPath = `points/posts/${postId}/${userId}.json`;
  const url = `${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${pointPath}`;

  // 🔍 Check if already voted
  const check = await fetch(`${url}?ref=${ENV.GITHUB_BRANCH}`, {
    headers: headers(),
  });

  if (check.ok) {
    return { ok: true, already: true };
  }

  /* ---------------- CREATE POINT EVENT ---------------- */

  const create = await fetch(url, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      message: `point ${pointId}`,
      content: toBase64({
        id: pointId,
        postId,
        from: userId,
        to: postOwnerId,
        ts,
      }),
      branch: ENV.GITHUB_BRANCH,
    }),
  });

  if (!create.ok) {
    const err = await create.text();
    throw new Error(`Point add failed: ${err}`);
  }

  /* ---------------- UPDATE USER TOTAL ---------------- */

  await incrementUserPoints(postOwnerId, 1);

  return { ok: true };
}

/* ======================================================
   USER POINT TOTAL (SHA SAFE)
====================================================== */

async function incrementUserPoints(userId, delta) {
  const path = `points/users/${userId}.json`;
  const url = `${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}`;

  let data = { userId, points: 0 };
  let sha = null;

  // 🔍 Read existing
  const res = await fetch(`${url}?ref=${ENV.GITHUB_BRANCH}`, {
    headers: headers(),
  });

  if (res.ok) {
    const json = await res.json();
    sha = json.sha;
    data = JSON.parse(
      Buffer.from(json.content, "base64").toString("utf8")
    );
  }

  data.points = Number(data.points || 0) + delta;
  data.updatedAt = Date.now();

  // 💾 Write back (SHA aware)
  const save = await fetch(url, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      message: `points +${delta}`,
      content: toBase64(data),
      ...(sha ? { sha } : {}),
      branch: ENV.GITHUB_BRANCH,
    }),
  });

  if (!save.ok) {
    const err = await save.text();
    throw new Error(`User point update failed: ${err}`);
  }
}
