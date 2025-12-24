/* 
  GitHub Storage Layer
  - Serverless safe
  - Node runtime only
  - No import-time env access
*/

function getEnv() {
  return {
    OWNER: process.env.GITHUB_OWNER,
    REPO: process.env.GITHUB_REPO,
    BRANCH: process.env.GITHUB_BRANCH || "main",
    TOKEN: process.env.GITHUB_TOKEN
  };
}

function getHeaders() {
  const { TOKEN } = getEnv();
  if (!TOKEN) throw new Error("GITHUB_TOKEN missing");

  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "vercel-serverless"
  };
}

const BASE = "https://api.github.com";

/* ------------------ READ FILE ------------------ */
export async function readFile(path) {
  const { OWNER, REPO, BRANCH } = getEnv();

  if (!OWNER || !REPO) {
    throw new Error("GITHUB_OWNER or GITHUB_REPO missing");
  }

  const res = await fetch(
    `${BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: getHeaders() }
  );

  if (res.status === 404) {
    return { content: null, sha: null };
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub read failed: ${err}`);
  }

  const json = await res.json();

  return {
    content: Buffer.from(json.content, "base64").toString("utf8"),
    sha: json.sha
  };
}

/* ------------------ WRITE FILE ------------------ */
export async function writeFile(path, content, sha) {
  const { OWNER, REPO, BRANCH } = getEnv();

  if (!OWNER || !REPO) {
    throw new Error("GITHUB_OWNER or GITHUB_REPO missing");
  }

  const body = {
    message: "serverless update",
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: BRANCH
  };

  // required for updates, optional for first write
  if (sha) body.sha = sha;

  const res = await fetch(
    `${BASE}/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub write failed: ${err}`);
  }

  return res.json();
}
