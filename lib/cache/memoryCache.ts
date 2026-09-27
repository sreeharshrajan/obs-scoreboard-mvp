type CacheEntry<T> = {
    data: T;
    expiry: number;
};

/**
 * Lightweight in-memory TTL cache to prevent hitting Firestore daily read limits.
 * Serves rapid consecutive requests (like OBS overlay polling) directly from memory.
 */
class MemoryCache {
    private cache = new Map<string, CacheEntry<any>>();

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }

    set<T>(key: string, data: T, ttlMs: number = 2000): void {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttlMs,
        });
    }

    async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number = 2000): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) return cached;
        const fresh = await fetchFn();
        this.set(key, fresh, ttlMs);
        return fresh;
    }

    invalidate(keyPrefix: string): void {
        for (const k of this.cache.keys()) {
            if (k.startsWith(keyPrefix)) {
                this.cache.delete(k);
            }
        }
    }

    clear(): void {
        this.cache.clear();
    }
}

// Singleton instance shared across API route invocations in Node runtime
const globalForCache = globalThis as unknown as {
    memoryCache?: MemoryCache;
};

export const memoryCache = globalForCache.memoryCache ?? (globalForCache.memoryCache = new MemoryCache());

