import { findPostById, savePost } from "./github.js";

export async function addPoint({ postId, userId }) {
  if (!postId || !userId) throw new Error("Invalid input");

  const { post, file } = await findPostById(postId);

  post.points ||= [];

  if (post.points.includes(userId)) {
    throw new Error("Already voted");
  }

  post.points.push(userId);
  post.updatedAt = Date.now();

  await savePost({ post, file });

  return { ok: true };
}
