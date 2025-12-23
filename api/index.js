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
  // ✅ Global CORS
  allowCORS(req, res);

  // ✅ Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const action = req.query?.action;

    // ✅ Health check
    if (!action) {
      return res.status(200).json({ status: "alive" });
    }

    /* -------------------- POSTS -------------------- */

    if (action === "post:list") {
      const posts = await listPosts();
      return res.status(200).json(posts.map(publicPost));
    }

    if (action === "post:create") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST required" });
      }

      // 🔴 MUST be awaited (serverless critical)
      const result = await createPost(req.body);

      return res.status(200).json(result);
    }

    if (action === "post:update") {
      requireAdmin(req);

      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST required" });
      }

      await updatePost(req.body);
      return res.status(200).json({ ok: true });
    }

    if (action === "post:delete") {
      requireAdmin(req);

      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST required" });
      }

      await deletePost(req.body);
      return res.status(200).json({ ok: true });
    }

    /* -------------------- ADMIN -------------------- */

    if (action === "admin:posts") {
      requireAdmin(req);

      const posts = await listPosts();
      return res.status(200).json(posts.map(adminPost));
    }

    /* -------------------- NOTIFICATIONS -------------------- */

    if (action === "notify") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST required" });
      }

      const { token, title, body } = req.body || {};

      if (!token || !title || !body) {
        return res.status(400).json({ error: "Missing fields" });
      }

      await sendFCM(token, title, body);
      return res.status(200).json({ ok: true });
    }

    /* -------------------- FALLBACK -------------------- */

    return res.status(404).json({ error: "Invalid action" });
  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({
      error: err.message || "Internal Server Error"
    });
  }
}
