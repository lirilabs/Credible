const store = new Map();

export function setCache(key, value, ttl = 30000) {
  store.set(key, value);
  setTimeout(() => store.delete(key), ttl);
}

export function getCache(key) {
  return store.get(key);
}
