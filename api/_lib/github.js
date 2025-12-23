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
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

/* ---------------- IMAGE UPLOAD ---------------- */

export async function uploadImage(base64, mime = "image/jpeg") {
  const clean = base64.includes(",")
    ? base64.split(",")[1]
    : base64;

  const ext = mime.split("/")[1] || "jpg";
  const folder = yearMonth(Date.now());
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `assets/images/${folder}/${name}`;

  const res = await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `image ${name}`,
        content: clean,
        branch: GITHUB_BRANCH
      })
    }
  );

  if (!res.ok) throw new Error("Image upload failed");

  const json = await res.json();
  return json.content.download_url;
}

/* ---------------- CREATE ---------------- */

export async function createPost(body) {
  const ts = Date.now();
  const id = crypto.randomUUID();

  let image = null;
  if (body.imageBase64) {
    image = await uploadImage(body.imageBase64, body.imageType);
  }

  const post = {
    id,
    userId: body.userId,
    text: body.text,
    tags: Array.isArray(body.tags) ? body.tags : [],
    image,
    ts
  };

  const folder = yearMonth(ts);
  const path = `posts/${folder}/${id}.json`;

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

  if (!res.ok) throw new Error("Post create failed");

  return { ok: true, id };
}

/* ---------------- READ ---------------- */

export async function listPosts() {
  const out = [];

  const rootRes = await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`,
    { headers: headers() }
  );

  if (!rootRes.ok) return [];

  const root = await rootRes.json();
  if (!Array.isArray(root)) return [];

  for (const dir of root) {
    if (dir.type !== "dir") continue;

    const filesRes = await fetch(dir.url, { headers: headers() });
    if (!filesRes.ok) continue;

    const files = await filesRes.json();
    for (const f of files) {
      if (!f.download_url) continue;
      try {
        const raw = await fetch(f.download_url);
        out.push(await raw.json());
      } catch {}
    }
  }

  return out;
}

/* ---------------- UPDATE ---------------- */

export async function updatePost({ id, userId, text, isAdmin }) {
  const root = await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`,
    { headers: headers() }
  ).then(r => r.json());

  for (const dir of root) {
    if (dir.type !== "dir") continue;

    const files = await fetch(dir.url, { headers: headers() }).then(r => r.json());
    for (const file of files) {
      if (!file.name.startsWith(id)) continue;

      const post = await fetch(file.download_url).then(r => r.json());

      if (!isAdmin && post.userId !== userId) {
        throw new Error("Not allowed");
      }

      post.text = text;
      post.updatedAt = Date.now();

      const res = await fetch(file.url, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          message: `update ${id}`,
          content: toBase64(post),
          sha: file.sha,
          branch: GITHUB_BRANCH
        })
      });

      if (!res.ok) throw new Error("Update failed");
      return { ok: true };
    }
  }

  throw new Error("Post not found");
}

/* ---------------- DELETE ---------------- */

export async function deletePost({ id, userId, isAdmin }) {
  const root = await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`,
    { headers: headers() }
  ).then(r => r.json());

  for (const dir of root) {
    if (dir.type !== "dir") continue;

    const files = await fetch(dir.url, { headers: headers() }).then(r => r.json());
    for (const file of files) {
      if (!file.name.startsWith(id)) continue;

      const post = await fetch(file.download_url).then(r => r.json());
      if (!isAdmin && post.userId !== userId) {
        throw new Error("Not allowed");
      }

      await fetch(file.url, {
        method: "DELETE",
        headers: headers(),
        body: JSON.stringify({
          message: `delete ${id}`,
          sha: file.sha,
          branch: GITHUB_BRANCH
        })
      });

      return { ok: true };
    }
  }

  throw new Error("Post not found");
}
