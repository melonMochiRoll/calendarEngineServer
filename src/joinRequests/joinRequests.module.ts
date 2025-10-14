import { Module } from '@nestjs/common';
import { JoinRequestsController } from './joinRequests.controller';
import { JoinRequestsService } from './joinRequests.service';
import { JoinRequests } from 'src/entities/JoinRequests';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { Roles } from 'src/entities/Roles';
import { RefreshTokens } from 'src/entities/RefreshTokens';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';
import { RolesModule } from 'src/roles/roles.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JoinRequests,
      Sharedspaces,
      SharedspaceMembers,
      Roles,
      RefreshTokens,
    ]),
    SharedspacesModule,
    RolesModule,
    UsersModule,
  ],
  controllers: [ JoinRequestsController ],
  providers: [ JoinRequestsService ],
  exports: [],
})

export class JoinRequestsModule {}