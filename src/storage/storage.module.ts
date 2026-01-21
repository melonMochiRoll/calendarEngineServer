import { Module } from '@nestjs/common';
import { STORAGE_SERVICE } from 'src/typings/types';
import { StorageOciService } from './storage.oci.service';
import { StorageS3Service } from './storage.s3.service';
import { StorageR2Service } from './storage.r2.service';

@Module({
  providers: [
    StorageS3Service,
    StorageOciService,
    StorageR2Service,
    {
      provide: STORAGE_SERVICE,
      useFactory: (
        s3: StorageS3Service,
        oci: StorageOciService,
        r2: StorageR2Service
      ) => {
        const storageMap = {
          's3': s3,
          'oci': oci,
          'r2': r2,
        };
        
        return storageMap[process.env.STORAGE_PROVIDER];
      },
      inject: [
        StorageS3Service,
        StorageOciService,
        StorageR2Service,
      ],
    },
  ],
  exports: [ STORAGE_SERVICE ],
})

export class StorageModule {}