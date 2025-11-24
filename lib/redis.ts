import Redis from 'ioredis';

// Create Redis client
const getRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const isUpstash = redisUrl.includes('upstash');

  const options: any = {
    maxRetriesPerRequest: null, // null = retry indefinitely
    enableReadyCheck: false,
    enableOfflineQueue: true,
    tls: isUpstash ? { rejectUnauthorized: false } : undefined,
    reconnectOnError: (err: any) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  };

  // Upstash-specific settings
  if (isUpstash) {
    options.connectTimeout = 10000;
    options.commandTimeout = 10000;
    options.retryStrategy = (times: number) => {
      if (times > 10) return null; // Stop retrying after 10 attempts
      return Math.min(times * 100, 3000);
    };
  } else {
    // Local Redis settings
    options.connectTimeout = 5000;
    options.retryStrategy = (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    };
  }

  const client = new Redis(redisUrl, options);

  let hasLogged = false;

  client.on('connect', () => {
    if (!hasLogged) {
      console.log('✅ Redis connected successfully');
      hasLogged = true;
    }
  });

  client.on('error', (err) => {
    // Only log real errors, ignore connection reset errors during reconnection
    const errorMessage = err.message || err.toString();
    if (!errorMessage.includes("missing 'error' handler") &&
        !errorMessage.includes('ECONNRESET') &&
        !errorMessage.includes('Connection is closed')) {
      console.error('❌ Redis error:', errorMessage);
    }
  });

  client.on('ready', () => {
    console.log('✅ Redis client ready');
  });

  client.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
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
