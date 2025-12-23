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
  text: typeof p.text === "string" ? p.text : decrypt(p.text),
  image: typeof p.image === "string" ? p.image : decrypt(p.image)
});
