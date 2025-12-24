import admin from "./firebase.js";

export async function sendFCM({
  token,
  title,
  body,
  imageUrl,
  clickAction,
  data = {},
}) {
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
    data: {
      ...Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      ...(clickAction ? { click_action: clickAction } : {}),
    },
    android: {
      priority: "high",
      notification: { sound: "default", channelId: "default" },
    },
    apns: {
      payload: { aps: { sound: "default", mutableContent: true } },
    },
  };

  return await admin.messaging().send(message);
}
