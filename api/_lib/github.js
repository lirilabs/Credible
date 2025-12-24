import crypto from "crypto";
import fetch from "node-fetch";
import { ENV } from "./env.js";

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

export async function uploadImage(base64, mime = "image/jpeg") {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  const ext = mime.split("/")[1] || "jpg";
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `assets/images/${yearMonth(Date.now())}/${name}`;

  const res = await fetch(
    `${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `image ${name}`,
        content: clean,
        branch: ENV.GITHUB_BRANCH,
      }),
    }
  );

  if (!res.ok) throw new Error("Image upload failed");
  const json = await res.json();
  return json.content.download_url;
}

export async function createPost(body) {
  const id = crypto.randomUUID();
  const ts = Date.now();

  let image = null;
  if (body.imageBase64) {
    image = await uploadImage(body.imageBase64, body.imageType);
  }

  const post = {
    id,
    userId: body.userId,
    text: body.text,
    tags: body.tags || [],
    image,
    ts,
  };

  const path = `posts/${yearMonth(ts)}/${id}.json`;

  const res = await fetch(
    `${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `post ${id}`,
        content: toBase64(post),
        branch: ENV.GITHUB_BRANCH,
      }),
    }
  );

  if (!res.ok) throw new Error("Post create failed");
  return { ok: true, id };
}

export async function listPosts() {
  const out = [];
  const root = await fetch(
    `${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/posts?ref=${ENV.GITHUB_BRANCH}`,
    { headers: headers() }
  ).then(r => r.json());

  if (!Array.isArray(root)) return [];

  for (const dir of root) {
    if (dir.type !== "dir") continue;
    const files = await fetch(dir.url, { headers: headers() }).then(r => r.json());
    for (const f of files) {
      if (f.download_url) {
        const raw = await fetch(f.download_url);
        out.push(await raw.json());
      }
    }
  }
  return out;
}
