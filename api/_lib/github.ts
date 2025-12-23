import fetch from "node-fetch";
import crypto from "crypto";
import { ENV } from "./env";
import { encrypt } from "./crypto";

const API = "https://api.github.com";

const headers = () => ({
  Authorization: `Bearer ${ENV.GITHUB_TOKEN}`,
  "User-Agent": "credible-serverless"
});

export async function createPost(input: {
  userId: string;
  text: string;
  imageRef: string;
  tags: string[];
}) {
  const id = crypto.randomUUID();
  const month = new Date().toISOString().slice(0, 7);

  const post = {
    id,
    userId: input.userId,
    text: encrypt(input.text),
    image: encrypt(input.imageRef),
    tags: input.tags,
    ts: Date.now()
  };

  const path = `data/posts/${month}/${id}.json`;

  await fetch(
    `${API}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        message: `db:add:${id}`,
        content: Buffer.from(JSON.stringify(post)).toString("base64"),
        branch: ENV.GITHUB_BRANCH
      })
    }
  );

  return { id };
}

export async function listPosts() {
  const res = await fetch(
    `${API}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/data/posts`,
    { headers: headers() }
  );

  const months = await res.json();
  const posts: any[] = [];

  for (const m of months) {
    const r = await fetch(m.url, { headers: headers() });
    posts.push(...(await r.json()));
  }

  return posts;
}
