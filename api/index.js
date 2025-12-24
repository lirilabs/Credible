import { getPosts, likePost, commentPost } from "../_lib/post.service.js";
import { parseBody } from "../_lib/body.js";

export default async function handler(req, res) {
  try {
    const { action } = req.query || {};

    if (!action) {
      return res.json({
        ok: true,
        message: "API running",
        actions: ["ping", "posts", "like", "comment"]
      });
    }

    if (action === "ping") {
      return res.json({ ok: true, ts: Date.now() });
    }

    if (action === "posts") {
      return res.json(await getPosts());
    }

    const body = await parseBody(req);

    if (action === "like") {
      return res.json(await likePost(body.postId, body.uid));
    }

    if (action === "comment") {
      await commentPost(body.postId, body.uid, body.text);
      return res.json({ ok: true });
    }

    res.status(400).json({ error: "INVALID_ACTION" });
  } catch (e) {
    console.error("API ERROR:", e);
    res.status(500).json({ error: e.message || "SERVER_ERROR" });
  }
}
