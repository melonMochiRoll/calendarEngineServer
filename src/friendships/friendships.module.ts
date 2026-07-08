import { Module } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { FriendshipsController } from './friendships.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendships } from 'src/entities/Friendships';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Friendships,
    ]),
    SharedspacesModule,
    UsersModule,
  ],
  controllers: [ FriendshipsController ],
  providers: [ FriendshipsService ],
  exports: [],
})
export class FriendshipsModule {}