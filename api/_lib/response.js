export const publicPost = (p) => ({
  id: p.id,
  userId: p.userId,
  tags: Array.isArray(p.tags) ? p.tags : [],
  ts: p.ts,
  text: p.text,
  image: p.image
});

export const adminPost = publicPost;
