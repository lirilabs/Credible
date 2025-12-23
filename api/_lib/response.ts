import { decrypt } from "./crypto";

export function publicPost(p: any) {
  return {
    id: p.id,
    userId: p.userId,
    tags: p.tags,
    ts: p.ts,
    text: p.text,
    image: p.image
  };
}

export function adminPost(p: any) {
  return {
    ...p,
    text: decrypt(p.text),
    image: decrypt(p.image)
  };
}
