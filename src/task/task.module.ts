import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/entities/Users';
import { UsersModule } from 'src/users/users.module';
import { BatchScheduler } from 'src/entities/BatchScheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      BatchScheduler,
    ]),
    UsersModule,
  ],
  providers: [ TaskService ],
})

export class TaskModule {}