import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '../services/logger.service';

/**
 * Basic in-memory rate limiter using the sliding window construct conceptually.
 * For true multi-node production, this MUST use Redis.
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;

export async function rateLimiterMiddleware(req: NextRequest) {
  // Use X-Forwarded-For for IP, fallback to generic "anonymous" if missing
  // In a Next.js App Router context, you typically get IP from request headers or geo object
  const ip = req.headers.get('x-forwarded-for') || req.ip || 'anonymous';
  
  // Optional: Extract userId from headers/session if authenticated
  const userId = req.headers.get('x-user-id');
  const identifier = userId ? `user:${userId}` : `ip:${ip}`;

  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean old window
  if (record && now > record.resetTime) {
    rateLimitStore.delete(identifier);
  }

  const currentRecord = rateLimitStore.get(identifier) || { count: 0, resetTime: now + WINDOW_MS };
  
  if (currentRecord.count >= MAX_REQUESTS) {
    logger.warn('Rate limit exceeded', { identifier, limit: MAX_REQUESTS, windowMs: WINDOW_MS });
    
    return NextResponse.json(
      { 
        error: 'Too many requests, try again later',
        retryAfter: Math.ceil((currentRecord.resetTime - now) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((currentRecord.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': currentRecord.resetTime.toString()
        }
      }
    );
  }

  // Increment and save
  currentRecord.count += 1;
  rateLimitStore.set(identifier, currentRecord);

  // Create response and set rate limit headers for successful pass
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
  response.headers.set('X-RateLimit-Remaining', (MAX_REQUESTS - currentRecord.count).toString());
  response.headers.set('X-RateLimit-Reset', currentRecord.resetTime.toString());

  return response;
}
