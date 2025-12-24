import admin from "firebase-admin";
import { ENV } from "./env.js";

export function getFirebase() {
  if (!admin.apps.length) {
    if (
      !ENV.FIREBASE_PROJECT_ID ||
      !ENV.FIREBASE_CLIENT_EMAIL ||
      !ENV.FIREBASE_PRIVATE_KEY
    ) {
      console.error("Firebase env missing");
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: ENV.FIREBASE_PROJECT_ID,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
        privateKey: ENV.FIREBASE_PRIVATE_KEY,
      }),
    });
  }

  return admin;
}
