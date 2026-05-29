import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspacesController } from './sharedspaces.controller';
import { SharedspacesService } from './sharedspaces.service';
import { SpaceMembers } from 'src/entities/SpaceMembers';
import { Roles } from 'src/entities/Roles';
import { RefreshTokens } from 'src/entities/RefreshTokens';
import { Users } from 'src/entities/Users';
import { RolesModule } from 'src/roles/roles.module';
import { Spaces } from 'src/entities/Spaces';
import { Chats } from 'src/entities/Chats';
import { ChatImages } from 'src/entities/ChatImages';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Spaces,
      Sharedspaces,
      SpaceMembers,
      Roles,
      RefreshTokens,
      Users,
      Chats,
      ChatImages,
    ]),
    RolesModule,
  ],
  controllers: [ SharedspacesController ],
  providers: [
    SharedspacesService,
  ],
  exports: [
    SharedspacesService,
  ],
})

export class SharedspacesModule {}