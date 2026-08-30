import { InjectRedis } from "@nestjs-modules/ioredis";
import { Injectable } from "@nestjs/common";
import Redis from "ioredis";

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

  async set(key: string, value: string, ttl = 5000) {
    await this.redis.set(key, JSON.stringify(value), 'PX', ttl);
  }
}