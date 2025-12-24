export const config = { runtime: "nodejs" };

function getEnv() {
  return {
    GITHUB_OWNER: process.env.GITHUB_OWNER || null,
    GITHUB_REPO: process.env.GITHUB_REPO || null,
    GITHUB_BRANCH: process.env.GITHUB_BRANCH || "main",
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || null,

    SECRET_KEY: process.env.SECRET_KEY || null,
    ADMIN_KEY: process.env.ADMIN_KEY || null,

    FCM_PROJECT_ID: process.env.FCM_PROJECT_ID || null,
    FCM_CLIENT_EMAIL: process.env.FCM_CLIENT_EMAIL || null,
    FCM_PRIVATE_KEY: process.env.FCM_PRIVATE_KEY || null
  };
}

export default function handler(req, res) {
  try {
    const ENV = getEnv();

    // minimal health check
    return res.status(200).json({
      ok: true,
      message: "ENV DIRECT ACCESS OK",
      hasGithub: !!ENV.GITHUB_TOKEN,
      hasSecretKey: !!ENV.SECRET_KEY
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e.message
    });
  }
}
