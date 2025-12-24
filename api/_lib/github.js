import fetch from "node-fetch";
import { ENV } from "./env.js";

const GH = "https://api.github.com";

const headers = () => ({
  Authorization: `Bearer ${ENV.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json"
});

/* ================= FIND POST ================= */

export async function findPostById(postId) {
  const root = await fetch(
    `${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/posts?ref=${ENV.GITHUB_BRANCH}`,
    { headers: headers() }
  ).then(r => r.ok ? r.json() : []);

  for (const dir of root) {
    if (dir.type !== "dir") continue;

    const files = await fetch(dir.url, { headers: headers() })
      .then(r => r.ok ? r.json() : []);

    for (const file of files) {
      if (!file.name.startsWith(postId)) continue;

      const content = await fetch(file.download_url).then(r => r.json());

      // backward compatibility
      content.comments ||= [];
      content.points ||= [];

      return { post: content, file };
    }
  }

  throw new Error("Post not found");
}

/* ================= SAVE POST ================= */

export async function savePost({ post, file }) {
  const encoded = Buffer.from(JSON.stringify(post, null, 2)).toString("base64");

  const res = await fetch(file.url, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      message: "update post",
      content: encoded,
      sha: file.sha,
      branch: ENV.GITHUB_BRANCH
    })
  });

  if (!res.ok) throw new Error("GitHub save failed");
}

/* ================= LIST POSTS ================= */

export async function listPosts() {
  const posts = [];

  const root = await fetch(
    `${GH}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/posts?ref=${ENV.GITHUB_BRANCH}`,
    { headers: headers() }
  ).then(r => r.ok ? r.json() : []);

  for (const dir of root) {
    if (dir.type !== "dir") continue;

    const files = await fetch(dir.url, { headers: headers() })
      .then(r => r.ok ? r.json() : []);

    for (const f of files) {
      try {
        const post = await fetch(f.download_url).then(r => r.json());
        post.comments ||= [];
        post.points ||= [];
        posts.push(post);
      } catch {
        // ignore corrupted files
      }
    }
  }

  return posts;
}
