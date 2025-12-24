import { allowCORS } from "./_lib/cors.js";
import { isAdmin } from "./_lib/admin.js";

import {
  createPost,
  listPosts,
  updatePost,
  deletePost
} from "./_lib/github.js";

import { addComment } from "./_lib/comment.js";
import { addPoint } from "./_lib/point.js";

import { publicPost, adminPost } from "./_lib/response.js";

export default async function handler(req, res) {
  allowCORS(req, res);

  // 🔥 FORCE REALTIME (NO CACHE ANYWHERE)
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  if (req.method === "OPTIONS") return res.end();

  try {
    const action = req.query?.action;
    if (!action) return res.json({ status: "alive" });

    /* ---------- POSTS ---------- */

    if (action === "post:list") {
      const posts = await listPosts();
      return res.json(posts.map(publicPost));
    }

    if (action === "post:create") {
      return res.json(await createPost(req.body));
    }

    if (action === "post:update") {
      return res.json(await updatePost({
        ...req.body,
        isAdmin: isAdmin(req)
      }));
    }

    if (action === "post:delete") {
      return res.json(await deletePost({
        ...req.body,
        isAdmin: isAdmin(req)
      }));
    }

    /* ---------- COMMENTS ---------- */

    if (action === "comment:add") {
      return res.json(await addComment(req.body));
    }

    /* ---------- POINTS ---------- */

    if (action === "point:add") {
      return res.json(await addPoint(req.body));
    }

    /* ---------- ADMIN ---------- */

    if (action === "admin:posts") {
      if (!isAdmin(req)) throw new Error("Unauthorized");
      return res.json((await listPosts()).map(adminPost));
    }

    return res.status(404).json({ error: "Invalid action" });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
