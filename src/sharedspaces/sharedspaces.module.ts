import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspacesController } from './sharedspaces.controller';
import { SharedspacesService } from './sharedspaces.service';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { Roles } from 'src/entities/Roles';
import { RefreshTokens } from 'src/entities/RefreshTokens';
import { Users } from 'src/entities/Users';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sharedspaces,
      SharedspaceMembers,
      Roles,
      RefreshTokens,
      Users,
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