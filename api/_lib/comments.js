import crypto from "crypto";
import { findPostById, savePost } from "./github.js";

export async function addComment({ postId, userId, text }) {
  if (!postId || !userId || !text) {
    throw new Error("Invalid input");
  }

  const { post, file } = await findPostById(postId);

  post.comments.push({
    id: crypto.randomUUID(),
    userId,
    text,
    ts: Date.now()
  });

  await savePost({ post, file });

  return { ok: true };
}
