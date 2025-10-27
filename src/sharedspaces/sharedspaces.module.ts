import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspacesController } from './sharedspaces.controller';
import { SharedspacesService } from './sharedspaces.service';
import { IsExistSpaceConstraint } from 'src/common/validator/IsExistSpace';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { Roles } from 'src/entities/Roles';
import { Chats } from 'src/entities/Chats';
import { EventsModule } from 'src/events/events.module';
import { Images } from 'src/entities/Images';
import { AwsModule } from 'src/aws/aws.module';
import { RefreshTokens } from 'src/entities/RefreshTokens';
import { Users } from 'src/entities/Users';
import { RolesModule } from 'src/roles/roles.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sharedspaces,
      SharedspaceMembers,
      Roles,
      Chats,
      Images,
      RefreshTokens,
      Users,
    ]),
    EventsModule,
    AwsModule,
    RolesModule,
    UsersModule,
  ],
  controllers: [ SharedspacesController ],
  providers: [
    SharedspacesService,
    IsExistSpaceConstraint,
  ],
  exports: [
    SharedspacesService,
  ],
})

export class SharedspacesModule {}