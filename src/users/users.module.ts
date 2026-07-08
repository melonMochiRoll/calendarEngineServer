import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Users } from 'src/entities/Users';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceMembers } from 'src/entities/SpaceMembers';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';
import { SharedspacesUsersContoller } from './sharedspaces.users.controller';
import { RolesModule } from 'src/roles/roles.module';
import { Images } from 'src/entities/Images';
import { StorageModule } from 'src/storage/storage.module';
import { UsersFetcher } from './users.fetcher';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      SpaceMembers,
      Images,
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
    UsersFetcher,
  ],
  exports: [
    UsersService,
    UsersFetcher,
  ],
})

export class UsersModule {}