import crypto from 'crypto';
import { logger } from './logger.service';

// Basic in-memory cache fallback if Redis isn't available
// In a full production setup, you would replace this Map with a Redis Client (e.g., ioredis)
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

export class CacheService {
  /**
   * Generates a unique, deterministic hash for a prompt + model combination
   */
  static generateHash(prompt: string, modelId: string): string {
    return crypto
      .createHash('sha256')
      .update(`${modelId}:${prompt.trim()}`)
      .digest('hex');
  }

  /**
   * Retrieves a cached response if it exists and is not expired
   */
  static async get(prompt: string, modelId: string): Promise<string | null> {
    const key = this.generateHash(prompt, modelId);
    const cached = memoryCache.get(key);

    if (cached) {
      if (Date.now() > cached.expiresAt) {
        memoryCache.delete(key);
        return null;
      }
      logger.info('Cache hit', { modelId, cacheKey: key });
      // TODO: Increment Performance metrics for cache hit rate
      return cached.value;
    }
    
    return null;
  }

  /**
   * Stores a response in the cache with a TTL (Time To Live)
   * @param ttlSeconds Default is 1 hour (3600 seconds)
   */
  static async set(prompt: string, modelId: string, response: string, ttlSeconds: number = 3600): Promise<void> {
    const key = this.generateHash(prompt, modelId);
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    
    memoryCache.set(key, { value: response, expiresAt });
    logger.info('Response cached', { modelId, ttlSeconds });
  }

  /**
   * Utility to clear expired items (could be run on a cron job)
   */
  static sweep(): void {
    const now = Date.now();
    for (const [key, item] of memoryCache.entries()) {
      if (now > item.expiresAt) {
        memoryCache.delete(key);
      }
    }
  }
}
