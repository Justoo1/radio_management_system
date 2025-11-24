import Redis from 'ioredis';

// Create Redis client
const getRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });

  client.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  client.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
  });

  return client;
};

// Singleton instance
let redis: Redis | null = null;

export const getRedis = (): Redis => {
  if (!redis) {
    redis = getRedisClient();
  }
  return redis;
};

// Pub/Sub channels
export const REDIS_CHANNELS = {
  ON_AIR_NOW: (orgId: string) => `org:${orgId}:on-air:now`,
  QUEUE_UPDATE: (orgId: string) => `org:${orgId}:on-air:queue`,
  NEW_REQUEST: (orgId: string) => `org:${orgId}:requests:new`,
  TIMER_UPDATE: (orgId: string) => `org:${orgId}:timer:update`,
  LISTENER_COUNT: (orgId: string) => `org:${orgId}:listeners:count`,
};

export default getRedis;
