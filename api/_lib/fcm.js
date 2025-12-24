import { getFirebase } from "./firebase.js";

export async function sendFCM({
  token,
  title,
  body,
  imageUrl,
  clickAction,
  data = {},
}) {
  const admin = getFirebase();
  if (!admin) throw new Error("Firebase not initialized");

  if (!token || !title || !body) {
    throw new Error("token, title and body are required");
  }

  const message = {
    token,
    notification: {
      title,
      body,
      ...(imageUrl ? { image: imageUrl } : {}),
    },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    android: { priority: "high" },
    apns: { payload: { aps: { sound: "default" } } },
  };

  return await admin.messaging().send(message);
}
