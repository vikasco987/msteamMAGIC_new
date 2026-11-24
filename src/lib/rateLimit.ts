// In-memory sliding-window rate limiter for sensitive authentication endpoints
// Works per node process with automatic expired key cleanup

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, record] of rateLimitStore.entries()) {
            if (now > record.resetAt) {
                rateLimitStore.delete(key);
            }
        }
    }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
    limit?: number;        // Maximum allowed requests within window
    windowMs?: number;     // Window duration in ms
}

export function checkRateLimit(
    identifier: string,
    options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const limit = options.limit ?? 5; // Default 5 attempts
    const windowMs = options.windowMs ?? 15 * 60 * 1000; // Default 15-minute window
    const now = Date.now();

    const record = rateLimitStore.get(identifier);

    if (!record || now > record.resetAt) {
        // First request or window expired
        rateLimitStore.set(identifier, {
            count: 1,
            resetAt: now + windowMs
        });
        return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }

    if (record.count >= limit) {
        const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
        return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    record.count += 1;
    return {
        allowed: true,
        remaining: limit - record.count,
        retryAfterSeconds: 0
    };
}

export function resetRateLimit(identifier: string): void {
    rateLimitStore.delete(identifier);
}
