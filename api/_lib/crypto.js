import crypto from "crypto";
import { ENV } from "./env.js";

if (!ENV.SECRET_KEY) {
  throw new Error("SECRET_KEY is missing. Set it in Vercel environment variables.");
}

const KEY = crypto
  .createHash("sha256")
  .update(ENV.SECRET_KEY)
  .digest(); // 32 bytes

const ALGO = "aes-256-gcm";

export function encrypt(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(payload) {
  if (!payload) return null;

  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const content = buffer.subarray(28);

  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);

  return JSON.parse(
    Buffer.concat([decipher.update(content), decipher.final()]).toString("utf8")
  );
}
