import { Module } from '@nestjs/common';
import { STORAGE_SERVICE } from 'src/typings/types';
import { StorageOciService } from './storage.oci.service';
import { StorageS3Service } from './storage.s3.service';

@Module({
  providers: [
    StorageS3Service,
    StorageOciService,
    {
      provide: STORAGE_SERVICE,
      useFactory: (s3: StorageS3Service, oci: StorageOciService) => {
        return process.env.STORAGE_PROVIDER === 's3' ? s3 : oci;
      },
      inject: [ StorageS3Service, StorageOciService ],
    },
  ],
  exports: [ STORAGE_SERVICE ],
})

export class StorageModule {}