/* ------------------------------------------------------
   Normalize post (handles OLD + NEW data safely)
------------------------------------------------------ */
export function normalizePost(p) {
  return {
    id: p.id,
    userId: p.userId,
    text: p.text ?? "",
    image: p.image || null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    ts: p.ts,

    // ✅ Ensure arrays always exist
    comments: Array.isArray(p.comments) ? p.comments : [],
    points: Array.isArray(p.points) ? p.points : []
  };
}

/* ------------------------------------------------------
   Public response (used for feed)
------------------------------------------------------ */
export function publicPost(p) {
  const post = normalizePost(p);

  return {
    ...post,

    // ✅ Frontend-friendly extras
    pointCount: post.points.length,
    commentCount: post.comments.length
  };
}

/* ------------------------------------------------------
   Admin response (raw, editable)
------------------------------------------------------ */
export function adminPost(p) {
  return normalizePost(p);
}
