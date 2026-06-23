import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Users } from 'src/entities/Users';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokens } from 'src/entities/RefreshTokens';
import { SpaceMembers } from 'src/entities/SpaceMembers';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';
import { SharedspacesUsersContoller } from './sharedspaces.users.controller';
import { RolesModule } from 'src/roles/roles.module';
import { Images } from 'src/entities/Images';
import { ProfileImages } from 'src/entities/ProfileImages';
import { StorageModule } from 'src/storage/storage.module';
import { Friendships } from 'src/entities/Friendships';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      RefreshTokens,
      SpaceMembers,
      Images,
      ProfileImages,
      Friendships,
    ]),
    SharedspacesModule,
    RolesModule,
    StorageModule,
  ],
  controllers: [
    UsersController,
    SharedspacesUsersContoller,
  ],
  providers: [
    UsersService,
  ],
  exports: [ UsersService ],
})

export class UsersModule {}