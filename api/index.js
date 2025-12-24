import { getPosts, likePost, commentPost } from "../_lib/post.service.js";

export default async function handler(req, res) {
  try {
    const { action } = req.query;

    if (action === "ping") {
      return res.json({ ok: true, ts: Date.now() });
    }

    if (action === "posts") {
      return res.json(await getPosts());
    }

    if (action === "like") {
      const { postId, uid } = req.body;
      return res.json(await likePost(postId, uid));
    }

    if (action === "comment") {
      const { postId, uid, text } = req.body;
      await commentPost(postId, uid, text);
      return res.json({ ok: true });
    }

    res.status(400).json({ error: "INVALID_ACTION" });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
}
