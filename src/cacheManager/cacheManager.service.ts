import { Inject, Injectable } from "@nestjs/common";
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Injectable()
export class CacheManagerService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  generateCacheKey(
    userId: number,
    key: string,
  ) {
    return `${userId}-${key}`;
  };

  async getCache(
    userId: number,
    key: string,
  ) {
    try {
      const cacheKey = this.generateCacheKey(userId, key);
      const cached = await this.cacheManager.get(cacheKey) || null;

      return cached;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  async setCache(
    userId: number,
    key: string,
    value: any,
  ) {
    try {
      const cacheKey = this.generateCacheKey(userId, key);
      const ttl = key === 'userData' ? 900 : 5;

      await this.cacheManager.set(cacheKey, value, ttl);
    } catch (err) {
      console.error(err);
    }
  };

  async delCache(
    userId: number,
    key: string,
  ) {
    try {
      const cacheKey = this.generateCacheKey(userId, key);
      const cached = await this.cacheManager.get(cacheKey);
  
      if (!cached) return;
  
      await this.cacheManager.del(cacheKey);
    } catch (err) {
      console.error(err);
    }
  };

  async clearUserCache(userId: number) {
    try {
      const keys = await this.cacheManager.store.keys();

      if (!keys.length) {
        return;
      }

      keys
        .filter(key => key.startsWith(`${userId}-`))
        .forEach(key => this.cacheManager.del(key));
    } catch (err) {
      console.error(err);
    }
  }

  async resetCache() {
    try {
      await this.cacheManager.reset();
    } catch (err) {
      console.error(err);
    }
  };
}