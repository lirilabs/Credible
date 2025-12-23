import crypto from "crypto";

const {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH,
  GITHUB_TOKEN
} = process.env;

const GH_API = "https://api.github.com";

function headers() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json"
  };
}

function b64(obj) {
  return Buffer.from(JSON.stringify(obj, null, 2)).toString("base64");
}

function postPath(ts) {
  const d = new Date(ts);
  return `posts/${d.getFullYear()}-${d.getMonth() + 1}/${crypto
    .randomUUID()}.json`;
}

export async function createPost(data) {
  const ts = Date.now();

  const post = {
    id: crypto.randomUUID(),
    userId: data.userId,
    tags: Array.isArray(data.tags) ? data.tags : [],
    ts,
    text: data.text,
    image: data.image || null
  };

  const path = postPath(ts);

  const res = await fetch(`${GH_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      message: `post: ${post.id}`,
      content: b64(post),
      branch: GITHUB_BRANCH
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("GitHub write failed: " + err);
  }

  return { ok: true, path, post };
}

export async function listPosts() {
  const res = await fetch(
    `${GH_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`,
    { headers: headers() }
  );

  if (!res.ok) return [];

  const dirs = await res.json();
  const posts = [];

  for (const dir of dirs) {
    const filesRes = await fetch(dir.url, { headers: headers() });
    if (!filesRes.ok) continue;

    const files = await filesRes.json();
    for (const f of files) {
      if (!f.download_url) continue;
      const raw = await fetch(f.download_url);
      posts.push(await raw.json());
    }
  }

  return posts;
}
