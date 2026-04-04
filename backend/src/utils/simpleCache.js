const cacheStore = new Map();

export const getCached = (key) => {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (item.expiresAt < Date.now()) {
    cacheStore.delete(key);
    return null;
  }
  return item.value;
};

export const setCached = (key, value, ttlMs = 15000) => {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
};

export const clearCacheByPrefix = (prefix) => {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) cacheStore.delete(key);
  }
};

export const clearAllCache = () => cacheStore.clear();
