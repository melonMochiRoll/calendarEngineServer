import { Module } from '@nestjs/common';
import { JoinRequestsController } from './joinRequests.controller';
import { JoinRequestsService } from './joinRequests.service';
import { JoinRequests } from 'src/entities/JoinRequests';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { Roles } from 'src/entities/Roles';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JoinRequests,
      Sharedspaces,
      SharedspaceMembers,
      Roles,
    ]),
  ],
  controllers: [ JoinRequestsController ],
  providers: [ JoinRequestsService ],
  exports: [],
})

export class JoinRequestsModule {}