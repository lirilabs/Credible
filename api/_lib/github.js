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

/* ---------- LIST POSTS ---------- */
export async function listPosts() {
  const posts = [];

  const root = await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`,
    { headers: headers() }
  ).then(r => r.json());

  for (const dir of root) {
    if (dir.type !== "dir") continue;

    const files = await fetch(dir.url, { headers: headers() })
      .then(r => r.json());

    for (const f of files) {
      if (!f.download_url) continue;

      const post = await fetch(f.download_url).then(r => r.json());

      post.comments = Array.isArray(post.comments) ? post.comments : [];
      post.points = Array.isArray(post.points) ? post.points : [];

      // 🔐 CRITICAL
      post._path = f.path;
      post._sha = f.sha;

      posts.push(post);
    }
  }

  return posts;
}

/* ---------- CREATE POST ---------- */
export async function createPost(body) {
  const id = crypto.randomUUID();
  const ts = Date.now();

  const post = {
    id,
    userId: body.userId,
    text: body.text,
    image: body.image || null,
    tags: body.tags || [],
    comments: [],
    points: [],
    ts
  };

  const folder = new Date(ts).toISOString().slice(0, 7);
  const path = `posts/${folder}/${id}.json`;

  await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `post ${id}`,
        content: Buffer.from(JSON.stringify(post, null, 2)).toString("base64"),
        branch: GITHUB_BRANCH
      })
    }
  );

  return { ok: true, id };
}

/* ---------- ADD COMMENT ---------- */
export async function addComment({ postId, userId, text }) {
  const posts = await listPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) throw new Error("Post not found");

  post.comments.push({
    id: crypto.randomUUID(),
    userId,
    text,
    ts: Date.now()
  });

  await savePost(post);
  return { ok: true };
}

/* ---------- ADD POINT ---------- */
export async function addPoint({ postId, userId }) {
  const posts = await listPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) throw new Error("Post not found");

  if (!post.points.includes(userId)) {
    post.points.push(userId);
  }

  await savePost(post);
  return { ok: true };
}

/* ---------- SAVE POST (CORE FIX) ---------- */
async function savePost(post) {
  const clean = { ...post };
  delete clean._path;
  delete clean._sha;

  await fetch(
    `${GH}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${post._path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `update ${post.id}`,
        content: Buffer.from(JSON.stringify(clean, null, 2)).toString("base64"),
        sha: post._sha,
        branch: GITHUB_BRANCH
      })
    }
  );
}
