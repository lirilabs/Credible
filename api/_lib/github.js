/* _lib/github.js */

const BASE = "https://api.github.com";

function env() {
  return {
    OWNER: process.env.GITHUB_OWNER,
    REPO: process.env.GITHUB_REPO,
    BRANCH: process.env.GITHUB_BRANCH || "main",
    TOKEN: process.env.GITHUB_TOKEN
  };
}

function headers() {
  const { TOKEN } = env();
  if (!TOKEN) throw new Error("GITHUB_TOKEN missing");

  return {
    Authorization: `Bearer ${TOKEN}`,
    "User-Agent": "vercel-serverless",
    "Content-Type": "application/json"
  };
}

export async function readFile(path) {
  const { OWNER, REPO, BRANCH } = env();

  const res = await fetch(
    `${BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: headers() }
  );

  if (res.status === 404) {
    return { content: "[]", sha: null };
  }

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const json = await res.json();
  return {
    content: Buffer.from(json.content, "base64").toString("utf8"),
    sha: json.sha
  };
}

export async function writeFile(path, content, sha) {
  const { OWNER, REPO, BRANCH } = env();

  const body = {
    message: "update posts",
    content: Buffer.from(content).toString("base64"),
    branch: BRANCH
  };

  if (sha) body.sha = sha;

  const res = await fetch(
    `${BASE}/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
