import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheManagerService } from './cacheManager.service';

@Module({
  imports: [ CacheModule.register(), ],
  providers: [ CacheManagerService ],
  exports: [ CacheManagerService ],
})

export class CacheManagerModule {}