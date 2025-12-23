import { createPost, listPosts } from "./_lib/github";
import { decryptPayload } from "./_lib/crypto";
import { sendFCM } from "./_lib/notify";
import { json } from "./_lib/response";

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    if (action === "post:create") {
      const data = await createPost(req.body);
      return json(res, data);
    }

    if (action === "post:list") {
      const posts = await listPosts();
      return json(res, posts);
    }

    if (action === "admin:decrypt") {
      if (req.headers["x-admin-key"] !== process.env.ADMIN_KEY)
        return res.status(403).end();

      return json(res, decryptPayload(req.body));
    }

    if (action === "notify") {
      await sendFCM(req.body);
      return json(res, { ok: true });
    }

    return res.status(404).json({ error: "Invalid action" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
