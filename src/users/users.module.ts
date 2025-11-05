import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Users } from 'src/entities/Users';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokens } from 'src/entities/RefreshTokens';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';
import { SharedspacesUsersContoller } from './sharedspaces.users.controller';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      RefreshTokens,
      SharedspaceMembers,
    ]),
    SharedspacesModule,
    RolesModule,
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