import crypto from "crypto";
import fetch from "node-fetch";

const {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH,
  GITHUB_TOKEN
} = process.env;

const GH_API = "https://api.github.com";

/* -------------------------------------------------- */
/* Helpers                                            */
/* -------------------------------------------------- */

function headers() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json"
  };
}

function toBase64JSON(obj) {
  return Buffer.from(JSON.stringify(obj, null, 2)).toString("base64");
}

function yearMonth(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

/* -------------------------------------------------- */
/* IMAGE UPLOAD                                       */
/* -------------------------------------------------- */

/**
 * Uploads a base64 image into the SAME GitHub repo
 * Returns a public download URL
 */
export async function uploadImage(base64, mime = "image/jpeg") {
  if (!base64) return null;

  const ext = mime.split("/")[1] || "jpg";
  const ts = Date.now();
  const folder = yearMonth(ts);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `assets/images/${folder}/${filename}`;

  // Strip data:image/...;base64, prefix if present
  const cleanBase64 = base64.includes(",")
    ? base64.split(",")[1]
    : base64;

  const res = await fetch(
    `${GH_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `image upload ${filename}`,
        content: cleanBase64,
        branch: GITHUB_BRANCH
      })
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Image upload failed: " + err);
  }

  const json = await res.json();
  return json.content.download_url; // 🔥 public link
}

/* -------------------------------------------------- */
/* POST CREATE                                        */
/* -------------------------------------------------- */

export async function createPost(body) {
  if (!body?.userId || !body?.text) {
    throw new Error("Missing required fields");
  }

  const ts = Date.now();
  const id = crypto.randomUUID();

  let imageUrl = null;

  // 🔥 If image file provided → upload → get link
  if (body.imageBase64) {
    imageUrl = await uploadImage(
      body.imageBase64,
      body.imageType || "image/jpeg"
    );
  }

  const post = {
    id,
    userId: body.userId,
    tags: Array.isArray(body.tags) ? body.tags : [],
    ts,
    text: body.text,
    image: imageUrl
  };

  const folder = yearMonth(ts);
  const path = `posts/${folder}/${id}.json`;

  const res = await fetch(
    `${GH_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `post ${id}`,
        content: toBase64JSON(post),
        branch: GITHUB_BRANCH
      })
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Post write failed: " + err);
  }

  return {
    ok: true,
    id,
    image: imageUrl
  };
}

/* -------------------------------------------------- */
/* POST LIST (CRASH-PROOF)                            */
/* -------------------------------------------------- */

export async function listPosts() {
  const posts = [];

  const rootRes = await fetch(
    `${GH_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`,
    { headers: headers() }
  );

  // No posts directory yet → empty DB
  if (!rootRes.ok) return [];

  const root = await rootRes.json();
  if (!Array.isArray(root)) return [];

  for (const dir of root) {
    if (dir.type !== "dir") continue;

    const filesRes = await fetch(dir.url, { headers: headers() });
    if (!filesRes.ok) continue;

    const files = await filesRes.json();
    if (!Array.isArray(files)) continue;

    for (const file of files) {
      if (!file.download_url) continue;

      try {
        const raw = await fetch(file.download_url);
        const json = await raw.json();
        posts.push(json);
      } catch {
        // Skip corrupted / partial files
      }
    }
  }

  return posts;
}

/* -------------------------------------------------- */
/* UPDATE / DELETE (INTENTIONALLY SAFE STUBS)         */
/* -------------------------------------------------- */

export async function updatePost() {
  throw new Error("updatePost not implemented yet");
}

export async function deletePost() {
  throw new Error("deletePost not implemented yet");
}
