import { Module } from '@nestjs/common';
import { JoinRequestsController } from './joinRequests.controller';
import { JoinRequestsService } from './joinRequests.service';
import { JoinRequests } from 'src/entities/JoinRequests';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';
import { RolesModule } from 'src/roles/roles.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JoinRequests,
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