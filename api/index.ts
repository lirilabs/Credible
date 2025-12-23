import { createPost, listPosts } from "./_lib/github";
import { publicPost, adminPost } from "./_lib/response";
import { requireAdmin } from "./_lib/admin";
import { sendFCM } from "./_lib/fcm";

export default async function handler(req, res) {
  try {
    // Health check
    if (!req.query || !req.query.action) {
      return res.json({ status: "alive" });
    }

    const { action } = req.query;

    if (action === "post:list") {
      return res.json((await listPosts()).map(publicPost));
    }

    if (action === "post:create") {
      return res.json(await createPost(req.body));
    }

    if (action === "admin:posts") {
      requireAdmin(req);
      return res.json((await listPosts()).map(adminPost));
    }

    if (action === "notify") {
      await sendFCM(req.body.token, req.body.title, req.body.body);
      return res.json({ ok: true });
    }

    res.status(404).json({ error: "Invalid action" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
