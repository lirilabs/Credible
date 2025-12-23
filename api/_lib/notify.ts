import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import { ENV } from "./env";

export async function sendFCM(token: string, title: string, body: string) {
  if (!ENV.FCM_PRIVATE_KEY) return;

  const now = Math.floor(Date.now() / 1000);

  const jwtToken = jwt.sign(
    {
      iss: ENV.FCM_CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600
    },
    ENV.FCM_PRIVATE_KEY,
    { algorithm: "RS256" }
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`
  });

  const { access_token } = await res.json();

  await fetch(
    `https://fcm.googleapis.com/v1/projects/${ENV.FCM_PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: { token, notification: { title, body } }
      })
    }
  );
}
