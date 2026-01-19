/**
 * Cache Utility
 * Provides server-side caching with Redis and cache key management
 */

import { getRedis } from './redis'

// Cache operation timeout (3 seconds)
const CACHE_TIMEOUT_MS = 3000

/**
 * Wrap a promise with a timeout
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>((resolve) => {
    setTimeout(() => resolve(fallback), ms)
  })
  return Promise.race([promise, timeout])
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SUBSCRIPTION_PLANS: 3600,      // 1 hour - rarely changes
  ORGANIZATION_INFO: 300,        // 5 minutes
  ORGANIZATION_FEATURES: 300,    // 5 minutes
  DASHBOARD_METRICS: 120,        // 2 minutes
  REPORT_DATA: 900,              // 15 minutes
  CLIENT_LIST: 60,               // 1 minute
  PROGRAM_LIST: 60,              // 1 minute
} as const

// Cache key generators
export const CACHE_KEYS = {
  subscriptionPlans: () => 'cache:subscription-plans',
  organizationInfo: (orgId: string) => `cache:org:${orgId}:info`,
  organizationFeatures: (orgId: string) => `cache:org:${orgId}:features`,
  organizationLimits: (orgId: string) => `cache:org:${orgId}:limits`,
  dashboardMetrics: (orgId: string) => `cache:org:${orgId}:dashboard-metrics`,
  dashboardStats: (orgId: string) => `cache:org:${orgId}:dashboard-stats`,
  clientCount: (orgId: string) => `cache:org:${orgId}:client-count`,
  programCount: (orgId: string) => `cache:org:${orgId}:program-count`,
  reportRevenue: (orgId: string, period: string) => `cache:org:${orgId}:report:revenue:${period}`,
  reportClients: (orgId: string, period: string) => `cache:org:${orgId}:report:clients:${period}`,
  adminRevenue: () => 'cache:admin:revenue',
}

/**
 * Get cached data from Redis with timeout
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis()
    const fetchData = async (): Promise<T | null> => {
      const data = await redis.get(key)
      if (data) {
        return JSON.parse(data) as T
      }
      return null
    }
    // Timeout after 3 seconds and return null (cache miss)
    return await withTimeout(fetchData(), CACHE_TIMEOUT_MS, null)
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set cached data in Redis with TTL
 */
export async function setCache<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  try {
    const redis = getRedis()
    await redis.setex(key, ttlSeconds, JSON.stringify(data))
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

/**
 * Delete cached data
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    const redis = getRedis()
    await redis.del(key)
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

/**
 * Delete multiple cache keys by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis()
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Cache pattern delete error:', error)
  }
}

/**
 * Invalidate all organization-related caches
 */
export async function invalidateOrgCache(orgId: string): Promise<void> {
  await deleteCachePattern(`cache:org:${orgId}:*`)
}

/**
 * Cache-aside pattern: Get from cache or fetch and cache
 */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetchFn()

  // Cache the result (don't await to not block response)
  setCache(key, data, ttlSeconds).catch(console.error)

  return data
}

/**
 * Get subscription plans with caching
 */
export async function getCachedSubscriptionPlans() {
  const { prisma } = await import('./prisma')

  return cacheAside(
    CACHE_KEYS.subscriptionPlans(),
    CACHE_TTL.SUBSCRIPTION_PLANS,
    async () => {
      return prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      })
    }
  )
}

/**
 * Get organization info with caching
 */
export async function getCachedOrganizationInfo(orgId: string) {
  const { prisma } = await import('./prisma')

  return cacheAside(
    CACHE_KEYS.organizationInfo(orgId),
    CACHE_TTL.ORGANIZATION_INFO,
    async () => {
      return prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          maxUsers: true,
          maxClients: true,
          maxSMSPerMonth: true,
          maxStorageGB: true,
          maxPrograms: true,
          enabledFeatures: true,
          subscriptionId: true,
          trialEndDate: true,
          hasPaymentAccount: true,
        },
      })
    }
  )
}

/**
 * Get organization features with caching
 */
export async function getCachedOrganizationFeatures(orgId: string): Promise<string[]> {
  const { prisma } = await import('./prisma')

  return cacheAside(
    CACHE_KEYS.organizationFeatures(orgId),
    CACHE_TTL.ORGANIZATION_FEATURES,
    async () => {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { enabledFeatures: true },
      })

      if (!org?.enabledFeatures) return []

      try {
        return JSON.parse(org.enabledFeatures)
      } catch {
        return []
      }
    }
  )
}

/**
 * Get organization limits with caching
 */
export async function getCachedOrganizationLimits(orgId: string) {
  const { prisma } = await import('./prisma')

  return cacheAside(
    CACHE_KEYS.organizationLimits(orgId),
    CACHE_TTL.ORGANIZATION_INFO,
    async () => {
      return prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          maxUsers: true,
          maxClients: true,
          maxSMSPerMonth: true,
          maxStorageGB: true,
          maxPrograms: true,
        },
      })
    }
  )
}
