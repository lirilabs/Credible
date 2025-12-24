import { allowCORS } from "./_lib/cors.js";
import {
  createPost,
  listPosts,
  addComment,
  addPoint
} from "./_lib/github.js";
import { publicPost } from "./_lib/response.js";

export default async function handler(req, res) {
  allowCORS(req, res);
  if (req.method === "OPTIONS") return res.end();

  try {
    const action = req.query?.action;
    if (!action) return res.json({ status: "alive" });

    if (action === "post:list") {
      return res.json((await listPosts()).map(publicPost));
    }

    if (action === "post:create") {
      return res.json(await createPost(req.body));
    }

    if (action === "comment:add") {
      return res.json(await addComment(req.body));
    }

    if (action === "point:add") {
      return res.json(await addPoint(req.body));
    }

    return res.status(404).json({ error: "Invalid action" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
