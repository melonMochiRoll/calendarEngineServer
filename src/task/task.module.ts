import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { BatchScheduler } from 'src/entities/BatchScheduler';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';
import { Images } from 'src/entities/Images';
import { StorageModule } from 'src/storage/storage.module';
import { Todos } from 'src/entities/Todos';
import { Chats } from 'src/entities/Chats';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BatchScheduler,
      Images,
      Todos,
      Chats,
    ]),
    UsersModule,
    SharedspacesModule,
    StorageModule,
  ],
  providers: [ TaskService ],
})

export class TaskModule {}