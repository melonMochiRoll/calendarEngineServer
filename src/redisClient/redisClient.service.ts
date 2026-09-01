import { InjectRedis } from "@nestjs-modules/ioredis";
import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { TCacheTarget } from "src/typings/types";

@Injectable()
export class RedisClientService {
  constructor(
    @InjectRedis()
    private redis: Redis,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const result = await this.redis.get(key);

    if (!result) {
      return null;
    }
    
    return JSON.parse(result) as T;
  }

  async set<T extends TCacheTarget>(key: string, value: T, ttl = 5000) {
    if (ttl === 0) {
      await this.redis.set(key, JSON.stringify(value));
      return;
    }

    await this.redis.set(key, JSON.stringify(value), 'PX', ttl);
  }

  async del(key: string) {
    await this.redis.del(key);
  }
}