import crypto from "crypto";
import { ENV } from "./env.js";

const GH = "https://api.github.com";

const headers = () => ({
  Authorization: `Bearer ${ENV.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
});

const toBase64 = obj =>
  Buffer.from(JSON.stringify(obj, null, 2)).toString("base64");

/* ======================================================
   ADD POINT TO POST
====================================================== */

export async function addPoint({
  postId,
  postOwnerId,
  userId,
}) {
  if (!postId || !postOwnerId || !userId) {
    throw new Error("postId, postOwnerId, userId required");
  }

  // Prevent self-upvote
  if (postOwnerId === userId) {
    throw new Error("Cannot upvote your own post");
  }

  const pointId = crypto.randomUUID();
  const ts = Date.now();

  /* ---------------- STORE POINT EVENT ----------------
     One file = one vote (prevents overwrite)
  --------------------------------------------------- */

  const path = `points/posts/${postId}/${userId}.json`;

  const res = await fetch(
    `${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}`,
    {
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
    }
  );

  if (!res.ok) {
    // If file already exists → already voted
    if (res.status === 422) {
      throw new Error("Already voted");
    }
    throw new Error("Point add failed");
  }

  /* ---------------- UPDATE USER TOTAL ---------------- */

  await addUserPoints(postOwnerId, 1);

  return { ok: true };
}

/* ======================================================
   USER POINT TOTAL
====================================================== */

async function addUserPoints(userId, delta) {
  const path = `points/users/${userId}.json`;
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
        message: `points +${delta}`,
        content: toBase64(current),
        branch: ENV.GITHUB_BRANCH,
      }),
    }
  );
}
