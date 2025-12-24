import admin from "./firebase.js";
import nodemailer from "nodemailer";
import { ENV } from "./env.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: ENV.SMTP_EMAIL,
    pass: ENV.SMTP_PASSWORD,
  },
});

export async function sendMail({ to, subject, text, html, idToken }) {
  if (!idToken) throw new Error("Missing Firebase ID token");

  const decoded = await admin.auth().verifyIdToken(idToken);

  if (!to || !subject || (!text && !html)) {
    throw new Error("Invalid mail payload");
  }

  await transporter.sendMail({
    from: `"Credible" <${ENV.SMTP_EMAIL}>`,
    to,
    subject,
    text,
    html,
  });

  return { success: true, uid: decoded.uid };
}
