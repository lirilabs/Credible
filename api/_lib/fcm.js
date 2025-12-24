import admin from "firebase-admin";

/* ======================================================
   Firebase Admin Init (ONCE)
====================================================== */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

/* ======================================================
   INTERNAL FCM SENDER
====================================================== */
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
      notification: {
        sound: "default",
        channelId: "default",
        ...(imageUrl ? { imageUrl } : {}),
      },
    },

    apns: {
      payload: {
        aps: {
          sound: "default",
          mutableContent: true,
        },
      },
      fcmOptions: {
        ...(imageUrl ? { image: imageUrl } : {}),
      },
    },
  };

  return await admin.messaging().send(message);
}
