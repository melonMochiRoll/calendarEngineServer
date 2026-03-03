import { Module } from '@nestjs/common';
import { StorageR2Service } from './storage.r2.service';

@Module({
  providers: [ StorageR2Service ],
  exports: [ StorageR2Service ],
})

export class StorageModule {}