import { decrypt } from "./crypto.js";

export const publicPost = (p) => ({
  id: p.id,
  userId: p.userId,
  tags: Array.isArray(p.tags) ? p.tags : [],
  ts: p.ts,
  text: p.text ?? null,
  image: p.image ?? null
});

export const adminPost = (p) => ({
  id: p.id,
  userId: p.userId,
  tags: Array.isArray(p.tags) ? p.tags : [],
  ts: p.ts,

  // ✅ BACKWARD-SAFE DECRYPTION
  text:
    typeof p.text === "string"
      ? p.text
      : p.text && p.text.iv
      ? decrypt(p.text)
      : null,

  image:
    typeof p.image === "string"
      ? p.image
      : p.image && p.image.iv
      ? decrypt(p.image)
      : null
});
