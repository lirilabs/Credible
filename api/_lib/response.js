export function publicPost(p) {
  return {
    id: p.id,
    userId: p.userId,
    text: p.text,
    tags: p.tags,
    image: p.image,
    ts: p.ts,
  };
}

export function adminPost(p) {
  return p;
}
