import { decrypt } from "./crypto.js";

export const publicPost = p => ({
  id: p.id,
  userId: p.userId,
  tags: p.tags,
  ts: p.ts,
  text: p.text,
  image: p.image
});

export const adminPost = p => ({
  ...p,
  text: decrypt(p.text),
  image: decrypt(p.image)
});
