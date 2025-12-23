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

function b64(data) {
  return Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
}

function postPath(ts) {
  const d = new Date(ts);
  return `posts/${d.getFullYear()}-${d.getMonth() + 1}/${crypto.randomUUID()}.json`;
}

/* ---------- CREATE ---------- */
export async function createPost(body) {
  const ts = Date.now();

  const post = {
    id: crypto.randomUUID(),
    userId: body.userId,
    tags: Array.isArray(body.tags) ? body.tags : [],
    ts,
    text: body.text,
    image: body.image ?? null
  };

  const path = postPath(ts);

  const res = await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `post ${post.id}`,
        content: b64(post),
        branch: GITHUB_BRANCH
      })
    }
  );

  if (!res.ok) {
    throw new Error("GitHub write failed");
  }

  return { ok: true, id: post.id };
}

/* ---------- READ ---------- */
export async function listPosts() {
  const posts = [];

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
    if (!Array.isArray(files)) continue;

    for (const f of files) {
      if (!f.download_url) continue;
      try {
        const raw = await fetch(f.download_url);
        posts.push(await raw.json());
      } catch {
        // skip corrupted file
      }
    }
  }

  return posts;
}

/* ---------- UPDATE / DELETE (STUB SAFE) ---------- */
export async function updatePost() {
  throw new Error("Not implemented yet");
}

export async function deletePost() {
  throw new Error("Not implemented yet");
}
