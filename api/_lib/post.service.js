import { readFile, writeFile } from "./github.js";
import { encrypt, decrypt } from "./crypto.js";

const FILE = "data/posts.enc";

export async function getPosts() {
  const { data } = await readFile(FILE);
  if (!data) return [];
  return decrypt(data);
}

export async function savePosts(posts, sha) {
  return writeFile(FILE, encrypt(posts), sha);
}

export async function likePost(postId, uid) {
  const { data, sha } = await readFile(FILE);
  const posts = data ? decrypt(data) : [];

  const post = posts.find(p => p.id === postId);
  if (!post) throw "POST_NOT_FOUND";

  if (!post.likes.users[uid]) {
    post.likes.users[uid] = true;
    post.likes.count++;
    post.version++;
  }

  await savePosts(posts, sha);
  return post.likes;
}

export async function commentPost(postId, uid, text) {
  const { data, sha } = await readFile(FILE);
  const posts = data ? decrypt(data) : [];

  const post = posts.find(p => p.id === postId);
  if (!post) throw "POST_NOT_FOUND";

  post.comments.push({
    id: crypto.randomUUID(),
    uid,
    text,
    ts: Date.now()
  });

  post.version++;
  await savePosts(posts, sha);
}
