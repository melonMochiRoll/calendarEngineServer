import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspacesController } from './sharedspaces.controller';
import { SharedspacesService } from './sharedspaces.service';
import { IsExistSpaceConstraint } from 'src/common/validator/IsExistSpace';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { PublicSpaceGuard } from 'src/common/guard/public.space.guard';
import { Roles } from 'src/entities/Roles';
import { Chats } from 'src/entities/Chats';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sharedspaces,
      SharedspaceMembers,
      Roles,
      Chats,
    ]),
    EventsModule,
  ],
  controllers: [ SharedspacesController ],
  providers: [
    SharedspacesService,
    IsExistSpaceConstraint,
    PublicSpaceGuard,
  ],
  exports: [
    SharedspacesService,
  ],
})

export class SharedspacesModule {}