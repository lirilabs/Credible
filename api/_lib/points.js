import crypto from "crypto";
import { findPost, savePost } from "./comment.js";

export async function addPoint({ postId, userId }) {
  const { post, file } = await findPost(postId);

  post.points ||= [];

  if (post.points.includes(userId)) {
    throw new Error("Already voted");
  }

  post.points.push(userId);
  post.updatedAt = Date.now();

  await savePost({ post, file });
  return { ok: true };
}
