import { allowCORS } from "./_lib/cors.js";
import {
  createPost,
  listPosts,
  updatePost,
  deletePost
} from "./_lib/github.js";
import { publicPost, adminPost } from "./_lib/response.js";
import { requireAdmin } from "./_lib/admin.js";
import { sendFCM } from "./_lib/fcm.js";

export default async function handler(req, res) {
  // ✅ Apply CORS for EVERY request
  allowCORS(req, res);

  // ✅ Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Health check
    if (!req.query?.action) {
      return res.json({ status: "alive" });
    }

    const action = String(req.query.action);

    if (action === "post:list") {
      return res.json((await listPosts()).map(publicPost));
    }

    if (action === "post:create") {
      return res.json(await createPost(req.body));
    }

    if (action === "post:update") {
      requireAdmin(req);
      await updatePost(req.body);
      return res.json({ ok: true });
    }

    if (action === "post:delete") {
      requireAdmin(req);
      await deletePost(req.body);
      return res.json({ ok: true });
    }

    if (action === "admin:posts") {
      requireAdmin(req);
      return res.json((await listPosts()).map(adminPost));
    }

    if (action === "notify") {
      await sendFCM(req.body.token, req.body.title, req.body.body);
      return res.json({ ok: true });
    }

    return res.status(404).json({ error: "Invalid action" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
