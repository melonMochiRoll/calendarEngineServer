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
import { Images } from 'src/entities/Images';
import { AwsModule } from 'src/aws/aws.module';
import { RefreshTokens } from 'src/entities/RefreshTokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sharedspaces,
      SharedspaceMembers,
      Roles,
      Chats,
      Images,
      RefreshTokens,
    ]),
    EventsModule,
    AwsModule,
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