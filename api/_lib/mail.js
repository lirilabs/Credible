import admin from "firebase-admin";
import nodemailer from "nodemailer";

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
   SMTP Transport
====================================================== */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

/* ======================================================
   INTERNAL MAIL SENDER
====================================================== */
export async function sendMail({
  to,
  subject,
  text,
  html,
  idToken, // Firebase Auth ID token
}) {
  if (!to || !subject || (!text && !html)) {
    throw new Error("to, subject and text or html are required");
  }

  if (!idToken) {
    throw new Error("Missing Firebase ID token");
  }

  // Verify user
  const decoded = await admin.auth().verifyIdToken(idToken);

  await transporter.sendMail({
    from: `"Credible" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    text,
    html,
  });

  return {
    success: true,
    uid: decoded.uid,
  };
}
