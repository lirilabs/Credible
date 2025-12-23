import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import { ENV } from "./env";

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ENV.FCM_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };

  const token = jwt.sign(payload, ENV.FCM_PRIVATE_KEY, {
    algorithm: "RS256"
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
  });

  return (await res.json()).access_token;
}

export async function sendFCM(token: string, title: string, body: string) {
  const accessToken = await getAccessToken();

  await fetch(
    `https://fcm.googleapis.com/v1/projects/${ENV.FCM_PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body }
        }
      })
    }
  );
}
