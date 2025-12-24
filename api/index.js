import { allowCORS } from "./_lib/cors.js";
import { isAdmin } from "./_lib/admin.js";

import {
  createPost,
  listPosts,
} from "./_lib/github.js";

import { publicPost } from "./_lib/response.js";
import { sendFCM } from "./_lib/fcm.js";
import { sendMail } from "./_lib/mail.js";

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

    if (action === "notify:fcm") {
      if (!isAdmin(req)) throw new Error("Unauthorized");
      const messageId = await sendFCM(req.body);
      return res.json({ success: true, messageId });
    }

    if (action === "notify:mail") {
      if (!isAdmin(req)) throw new Error("Unauthorized");
      await sendMail(req.body);
      return res.json({ success: true });
    }

    return res.status(404).json({ error: "Invalid action" });

  } catch (e) {
    console.error("API ERROR:", e);
    return res.status(500).json({ error: e.message });
  }
}
