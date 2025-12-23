const required = [
  "GITHUB_OWNER",
  "GITHUB_REPO",
  "GITHUB_BRANCH",
  "GITHUB_TOKEN",
  "SECRET_KEY",
  "ADMIN_KEY",
  "FCM_PROJECT_ID",
  "FCM_CLIENT_EMAIL",
  "FCM_PRIVATE_KEY"
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env: ${key}`);
  }
}

export const ENV = {
  GITHUB_OWNER: process.env.GITHUB_OWNER!,
  GITHUB_REPO: process.env.GITHUB_REPO!,
  GITHUB_BRANCH: process.env.GITHUB_BRANCH!,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
  SECRET_KEY: process.env.SECRET_KEY!,
  ADMIN_KEY: process.env.ADMIN_KEY!,
  FCM_PROJECT_ID: process.env.FCM_PROJECT_ID!,
  FCM_CLIENT_EMAIL: process.env.FCM_CLIENT_EMAIL!,
  FCM_PRIVATE_KEY: process.env.FCM_PRIVATE_KEY!.replace(/\\n/g, "\n")
};
