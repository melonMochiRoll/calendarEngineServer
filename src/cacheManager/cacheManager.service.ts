import { Inject, Injectable } from "@nestjs/common";
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Injectable()
export class CacheManagerService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async getCache(
    key: string,
    property: string,
  ) {
    const cached = await this.cacheManager.get(key) || {};
    return cached[property] || null;
  };

  async setCache(
    key: string,
    property: string,
    value: any,
  ) {
    const cached = await this.cacheManager.get(key) || {};
    cached[property] = value;
    await this.cacheManager.set(key, cached);
  };

  async delCache(
    key: string,
    property: string,
  ) {
    const cached = await this.cacheManager.get(key) || {};
    if (!cached) return;

    delete cached[property];
    await this.cacheManager.set(key, cached);
  };

  async eliminate(
    key: string,
  ) {
    await this.cacheManager.del(key);
  };
}