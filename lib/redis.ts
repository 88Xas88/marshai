import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

let client: Redis | null = null
if (url && token) {
  client = new Redis({ url, token })
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!client) return null
  try {
    const v = await client.get<T>(key)
    return v ?? null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSec = 7200): Promise<void> {
  if (!client) return
  try {
    await client.set(key, value, { ex: ttlSec })
  } catch {
    // ignore cache failures
  }
}

export function planCacheKey(parts: { from: string; to: string; dates: string }): string {
  return `plan:${parts.from}:${parts.to}:${parts.dates}`.toLowerCase()
}
