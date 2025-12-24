/* GitHub storage – serverless safe */

function getEnv() {
  return {
    OWNER: process.env.GITHUB_OWNER,
    REPO: process.env.GITHUB_REPO,
    BRANCH: process.env.GITHUB_BRANCH || "main",
    TOKEN: process.env.GITHUB_TOKEN
  };
}

function headers() {
  const { TOKEN } = getEnv();
  if (!TOKEN) throw new Error("GITHUB_TOKEN missing");
  return {
    Authorization: `Bearer ${TOKEN}`,
    "User-Agent": "vercel",
    "Content-Type": "application/json"
  };
}

const BASE = "https://api.github.com";

export async function readFile(path) {
  const { OWNER, REPO, BRANCH } = getEnv();
  const res = await fetch(
    `${BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: headers() }
  );

  if (res.status === 404) return { content: null, sha: null };
  if (!res.ok) throw new Error(await res.text());

  const json = await res.json();
  return {
    content: Buffer.from(json.content, "base64").toString("utf8"),
    sha: json.sha
  };
}

export async function writeFile(path, content, sha) {
  const { OWNER, REPO, BRANCH } = getEnv();

  const body = {
    message: "update",
    content: Buffer.from(content, "utf8").toString("base64"),
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

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
