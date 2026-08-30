import { InjectRedis } from "@nestjs-modules/ioredis";
import { Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisClientService {
  constructor(
    @InjectRedis()
    private redis: Redis,
  ) {}
}