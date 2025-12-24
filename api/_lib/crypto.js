// _lib/env.js
export const ENV = {
  GITHUB_OWNER: process.env.GITHUB_OWNER ?? null,
  GITHUB_REPO: process.env.GITHUB_REPO ?? null,
  GITHUB_BRANCH: process.env.GITHUB_BRANCH ?? null,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? null,

  SECRET_KEY: process.env.SECRET_KEY ?? null,
  ADMIN_KEY: process.env.ADMIN_KEY ?? null,

  FCM_PROJECT_ID: process.env.FCM_PROJECT_ID ?? null,
  FCM_CLIENT_EMAIL: process.env.FCM_CLIENT_EMAIL ?? null,
  FCM_PRIVATE_KEY: process.env.FCM_PRIVATE_KEY ?? null
};
