import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheManagerService } from './cacheManager.service';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      max: 100,
    })
  ],
  providers: [ CacheManagerService ],
  exports: [ CacheManagerService ],
})

export class CacheManagerModule {}