const store = new Map<string, any>();

export function setCache(key: string, val: any, ttl = 30000) {
  store.set(key, val);
  setTimeout(() => store.delete(key), ttl);
}

export function getCache(key: string) {
  return store.get(key);
}
