import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspacesController } from './sharedspaces.controller';
import { SharedspacesService } from './sharedspaces.service';
import { SpaceMembers } from 'src/entities/SpaceMembers';
import { Users } from 'src/entities/Users';
import { RolesModule } from 'src/roles/roles.module';
import { Spaces } from 'src/entities/Spaces';
import { SharedspaceFetcher } from './sharedspaces.fetcher';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Spaces,
      Sharedspaces,
      SpaceMembers,
      Users,
    ]),
    RolesModule,
  ],
  controllers: [ SharedspacesController ],
  providers: [
    SharedspacesService,
    SharedspaceFetcher,
  ],
  exports: [
    SharedspacesService,
    SharedspaceFetcher,
  ],
})

export class SharedspacesModule {}