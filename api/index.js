import { allowCORS } from "./_lib/cors.js";
import {
  createPost,
  listPosts
} from "./_lib/github.js";
import { publicPost, adminPost } from "./_lib/response.js";
import { requireAdmin } from "./_lib/admin.js";

export default async function handler(req, res) {
  allowCORS(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const action = req.query?.action;

    if (!action) {
      return res.json({ status: "alive" });
    }

    if (action === "post:list") {
      const posts = await listPosts();
      return res.json(posts.map(publicPost));
    }

    if (action === "post:create") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST required" });
      }
      return res.json(await createPost(req.body));
    }

    if (action === "admin:posts") {
      requireAdmin(req);
      const posts = await listPosts();
      return res.json(posts.map(adminPost));
    }

    return res.status(404).json({ error: "Invalid action" });
  } catch (e) {
    console.error("SERVER ERROR:", e);
    return res.status(500).json({ error: e.message });
  }
}
