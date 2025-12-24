import fetch from "node-fetch";
import { ENV } from "./env.js";

const API = "https://api.github.com";

export async function readFile(path) {
  const res = await fetch(`${API}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}?ref=${ENV.GITHUB_BRANCH}`, {
    headers: { Authorization: `Bearer ${ENV.GITHUB_TOKEN}` }
  });

  if (res.status === 404) return { data: null, sha: null };
  const json = await res.json();

  return {
    data: Buffer.from(json.content, "base64").toString(),
    sha: json.sha
  };
}

export async function writeFile(path, content, sha) {
  return fetch(`${API}/repos/${ENV.GITHUB_OWNER}/${ENV.GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${ENV.GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "serverless update",
      content: Buffer.from(content).toString("base64"),
      sha,
      branch: ENV.GITHUB_BRANCH
    })
  });
}
