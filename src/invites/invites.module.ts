import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invites } from 'src/entities/Invites';
import { InvitesContoller } from './invites.controller';
import { InvitesService } from './invites.service';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';
import { UsersModule } from 'src/users/users.module';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invites,
    ]),
    SharedspacesModule,
    UsersModule,
    RolesModule,
  ],
  controllers: [ InvitesContoller ],
  providers: [ InvitesService ],
  exports: [],
})
export class InvitesModule {}