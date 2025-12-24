import { allowCORS } from "./_lib/cors.js";
import { isAdmin } from "./_lib/admin.js";

import {
  createPost,
  listPosts,
  updatePost,
  deletePost
} from "./_lib/github.js";

import { publicPost, adminPost } from "./_lib/response.js";
import { sendFCM } from "./_lib/fcm.js";
import { sendMail } from "./_lib/mail.js";

export default async function handler(req, res) {
  allowCORS(req, res);
  if (req.method === "OPTIONS") return res.end();

  try {
    const action = req.query?.action;
    if (!action) return res.json({ status: "alive" });

    /* ---------------- POSTS ---------------- */

    if (action === "post:list") {
      return res.json((await listPosts()).map(publicPost));
    }

    if (action === "post:create") {
      const result = await createPost(req.body);

      // 🔔 Optional FCM notify on new post
      if (req.body.fcmToken) {
        await sendFCM({
          token: req.body.fcmToken,
          notification: {
            title: "New post created",
            body: "Your content is now live"
          }
        });
      }

      return res.json(result);
    }

    if (action === "post:update") {
      return res.json(
        await updatePost({
          ...req.body,
          isAdmin: isAdmin(req)
        })
      );
    }

    if (action === "post:delete") {
      return res.json(
        await deletePost({
          ...req.body,
          isAdmin: isAdmin(req)
        })
      );
    }

    if (action === "admin:posts") {
      if (!isAdmin(req)) throw new Error("Unauthorized");
      return res.json((await listPosts()).map(adminPost));
    }

    /* ---------------- NOTIFICATIONS ---------------- */

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
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
