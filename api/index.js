import { allowCORS } from "./_lib/cors.js";
import { isAdmin } from "./_lib/admin.js";

import {
  createPost,
  listPosts,
  updatePost,
  deletePost
} from "./_lib/github.js";

import { publicPost, adminPost } from "./_lib/response.js";
import { addPoint } from "./_lib/points.js";

/* ======================================================
   MAIN SERVERLESS HANDLER
====================================================== */

export default async function handler(req, res) {
  // Enable CORS for all requests
  allowCORS(req, res);

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const action = String(req.query?.action || "");

    /* ======================================================
       HEALTH / PING
    ====================================================== */

    if (!action || action === "ping") {
      return res.json({
        status: "alive",
        ts: Date.now()
      });
    }

    /* ======================================================
       POSTS
    ====================================================== */

    // Public feed
    if (action === "post:list") {
      const posts = await listPosts();
      return res.json(posts.map(publicPost));
    }

    // Create post
    if (action === "post:create") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST required" });
      }

      return res.json(await createPost(req.body));
    }

    // Update post (owner or admin)
    if (action === "post:update") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST required" });
      }

      return res.json(
        await updatePost({
          ...req.body,
          isAdmin: isAdmin(req)
        })
      );
    }

    // Delete post (owner or admin)
    if (action === "post:delete") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST required" });
      }

      return res.json(
        await deletePost({
          ...req.body,
          isAdmin: isAdmin(req)
        })
      );
    }

    // Admin-only full data
    if (action === "admin:posts") {
      if (!isAdmin(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const posts = await listPosts();
      return res.json(posts.map(adminPost));
    }

    /* ======================================================
       POINT SYSTEM (UPVOTE)
    ====================================================== */

    if (action === "point:add") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "POST required" });
      }

      /*
        Required body:
        {
          postId,
          postOwnerId,
          userId
        }
      */

      return res.json(await addPoint(req.body));
    }

    /* ======================================================
       UNKNOWN ACTION
    ====================================================== */

    return res.status(404).json({
      error: "Invalid action",
      action
    });

  } catch (err) {
    console.error("API ERROR:", err);

    return res.status(500).json({
      error: err.message || "Internal Server Error"
    });
  }
}
