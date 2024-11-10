import { Module } from '@nestjs/common';
import { JoinRequestsController } from './joinRequests.controller';
import { JoinRequestsService } from './joinRequests.service';
import { JoinRequests } from 'src/entities/JoinRequests';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JoinRequests,
    ]),
  ],
  controllers: [ JoinRequestsController ],
  providers: [ JoinRequestsService ],
  exports: [],
})

export class SharedspacesModule {}