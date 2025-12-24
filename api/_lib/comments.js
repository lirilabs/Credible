import crypto from "crypto";
import fetch from "node-fetch";
import { ENV } from "./env.js";

export async function addComment({ postId, userId, text }) {
  if (!postId || !userId || !text) throw new Error("Invalid input");

  const postFile = await findPost(postId);
  postFile.post.comments ||= [];

  postFile.post.comments.push({
    id: crypto.randomUUID(),
    userId,
    text,
    ts: Date.now()
  });

  await savePost(postFile);
  return { ok: true };
}

/* helpers */
async function findPost(id) {
  const root = await fetch(
    `https://api.github.com/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/posts?ref=${ENV.GITHUB_BRANCH}`,
    { headers: { Authorization: `Bearer ${ENV.GITHUB_TOKEN}` } }
  ).then(r => r.json());

  for (const dir of root) {
    const files = await fetch(dir.url).then(r => r.json());
    for (const f of files) {
      if (f.name.startsWith(id)) {
        const post = await fetch(f.download_url).then(r => r.json());
        return { post, file: f };
      }
    }
  }
  throw new Error("Post not found");
}

async function savePost({ post, file }) {
  await fetch(file.url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${ENV.GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "comment added",
      content: Buffer.from(JSON.stringify(post)).toString("base64"),
      sha: file.sha,
      branch: ENV.GITHUB_BRANCH
    })
  });
}
