import { allowCORS } from "./_lib/cors.js";
import { isAdmin } from "./_lib/admin.js";
import {
  createPost,
  listPosts,
  updatePost,
  deletePost
} from "./_lib/github.js";
import { publicPost, adminPost } from "./_lib/response.js";

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

    return res.status(404).json({ error: "Invalid action" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
