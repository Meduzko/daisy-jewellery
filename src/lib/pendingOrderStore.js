import Redis from 'ioredis';

/**
 * Set REDIS_URL (e.g. redis://127.0.0.1:6379) — same on dev and production when Redis runs on the app host.
 * See .env.example and scripts/install-redis-debian.sh. Without REDIS_URL, a process-local Map is used (fragile on serverless).
 */
const TTL_SEC = 172800; // 48h — LiqPay callbacks are immediate; buffer for retries

let redisClient;

function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!redisClient) redisClient = new Redis(url);
  return redisClient;
}

function memoryStore() {
  if (!globalThis.__pendingOrderMemory) {
    globalThis.__pendingOrderMemory = new Map();
  }
  return globalThis.__pendingOrderMemory;
}

function memoryKey(orderId) {
  return String(orderId);
}

/**
 * Full order payload (same shape as client `orderData`) saved at payment creation.
 * LiqPay `info` stays small; callback loads this by `order_id` for send-email.
 */
export async function savePendingOrder(orderId, orderData) {
  const key = memoryKey(orderId);
  const redis = getRedis();
  if (redis) {
    await redis.setex(`pending_order:${key}`, TTL_SEC, JSON.stringify(orderData));
    return;
  }
  const store = memoryStore();
  const expiresAt = Date.now() + TTL_SEC * 1000;
  store.set(key, { orderData, expiresAt });
}

export async function getPendingOrder(orderId) {
  const key = memoryKey(orderId);
  const redis = getRedis();
  if (redis) {
    const raw = await redis.get(`pending_order:${key}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const store = memoryStore();
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.orderData;
}
