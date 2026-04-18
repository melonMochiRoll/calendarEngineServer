import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { BatchScheduler } from 'src/entities/BatchScheduler';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';
import { Images } from 'src/entities/Images';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BatchScheduler,
      Images,
    ]),
    UsersModule,
    SharedspacesModule,
    StorageModule,
  ],
  providers: [ TaskService ],
})

export class TaskModule {}