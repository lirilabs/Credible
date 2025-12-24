export function publicPost(p) {
  return {
    id: p.id,
    userId: p.userId,
    text: p.text,
    image: p.image || null,
    tags: p.tags || [],
    ts: p.ts,
    comments: Array.isArray(p.comments) ? p.comments : [],
    points: Array.isArray(p.points) ? p.points : []
  };
}
