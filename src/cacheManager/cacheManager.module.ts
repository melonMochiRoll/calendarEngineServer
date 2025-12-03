import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheManagerService } from './cacheManager.service';
import { OAuth2CSRFGuard } from 'src/auth/authGuard/oauth2.csrf.guard';
import KeyvRedis from '@keyv/redis';
import 'dotenv/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const url = `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}`;
        return {
          stores: [
            new KeyvRedis(url),
          ],
          ttl: 5000,
        };
      },
    }),
  ],
  providers: [
    CacheManagerService,
    OAuth2CSRFGuard,
  ],
  exports: [ CacheManagerService ],
})

export class CacheManagerModule {}