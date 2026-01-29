import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invites } from 'src/entities/Invites';
import { InvitesContoller } from './invites.controller';
import { InvitesService } from './invites.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invites,
    ]),
  ],
  controllers: [ InvitesContoller ],
  providers: [ InvitesService ],
  exports: [],
})
export class InvitesModule {}