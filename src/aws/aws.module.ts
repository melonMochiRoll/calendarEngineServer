import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';

@Module({
  providers: [ AwsService ],
  exports: [],
})

export class AwsModule {}