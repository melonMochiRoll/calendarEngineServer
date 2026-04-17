import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { BatchScheduler } from 'src/entities/BatchScheduler';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BatchScheduler,
    ]),
    UsersModule,
    SharedspacesModule,
  ],
  providers: [ TaskService ],
})

export class TaskModule {}