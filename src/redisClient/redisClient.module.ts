import { RedisModule } from "@nestjs-modules/ioredis";
import { Module } from "@nestjs/common";
import { RedisClientService } from "./redisClient.service";

@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: async () => {
        return {
          type: 'single',
          url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}`,
        };
      },
    }),
  ],
  providers: [ RedisClientService ],
  exports: [ RedisClientService ],
})

export class RedisClientModule {}