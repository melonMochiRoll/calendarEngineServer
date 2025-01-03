import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheManagerService } from './cacheManager.service';
import { OAuth2CSRFGuard } from 'src/auth/authGuard/oauth2.csrf.guard';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      max: 100,
      ttl: 5000,
    })
  ],
  providers: [
    CacheManagerService,
    OAuth2CSRFGuard,
  ],
  exports: [ CacheManagerService ],
})

export class CacheManagerModule {}