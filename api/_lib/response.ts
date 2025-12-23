import { decrypt } from "./crypto";

export const publicPost = (p: any) => ({
  id: p.id,
  userId: p.userId,
  tags: p.tags,
  ts: p.ts,
  text: p.text,
  image: p.image
});

export const adminPost = (p: any) => ({
  ...p,
  text: decrypt(p.text),
  image: decrypt(p.image)
});
