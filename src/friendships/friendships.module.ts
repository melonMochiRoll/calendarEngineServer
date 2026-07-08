import { Module } from '@nestjs/common';
import { FriendshipsService } from './friendships.service ';
import { FriendshipsController } from './friendships.controller';

@Module({
  imports: [ ],
  controllers: [ FriendshipsController ],
  providers: [ FriendshipsService ],
  exports: [],
})
export class FriendshipsModule {}