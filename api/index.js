import { allowCORS } from "./_lib/cors.js";
import { listPosts } from "./_lib/github.js";
import { addComment } from "./_lib/comment.js";
import { addPoint } from "./_lib/point.js";
import { publicPost } from "./_lib/response.js";

export default async function handler(req, res) {
  allowCORS(req, res);

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") return res.end();

  try {
    const action = req.query?.action;

    if (!action) return res.json({ status: "alive" });

    if (action === "post:list") {
      const posts = await listPosts();
      return res.json(posts.map(publicPost));
    }

    if (action === "comment:add") {
      return res.json(await addComment(req.body));
    }

    if (action === "point:add") {
      return res.json(await addPoint(req.body));
    }

    return res.status(404).json({ error: "Invalid action" });
  } catch (e) {
    console.error("API ERROR:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
