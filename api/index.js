import { allowCORS } from "./_lib/cors.js";
import { isAdmin } from "./_lib/admin.js";

import {
  createPost,
  listPosts,
  updatePost,
  deletePost
} from "./_lib/github.js";

import { addComment } from "./_lib/comments.js";
import { publicPost, adminPost } from "./_lib/response.js";

export default async function handler(req, res) {
  allowCORS(req, res);
  if (req.method === "OPTIONS") return res.end();

  try {
    const action = req.query?.action;

    /* ---------------- PING ---------------- */
    if (!action || action === "ping") {
      return res.json({
        ok: true,
        service: "credible",
        time: new Date().toISOString()
      });
    }

    /* ---------------- POSTS ---------------- */

    if (action === "post:list") {
      return res.json((await listPosts()).map(publicPost));
    }

    if (action === "post:create") {
      return res.json(await createPost(req.body));
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

    /* ---------------- COMMENTS ---------------- */

    if (action === "comment:add") {
      /*
        Expected body:
        {
          postId,
          postOwnerId,
          userId,
          text
        }
      */
      return res.json(await addComment(req.body));
    }

    /* ---------------- FALLBACK ---------------- */

    return res.status(404).json({ error: "Invalid action" });

  } catch (e) {
    console.error("API ERROR:", e);
    return res.status(500).json({ error: e.message });
  }
}
