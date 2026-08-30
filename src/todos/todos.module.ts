import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todos } from 'src/entities/Todos';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';
import { RolesModule } from 'src/roles/roles.module';
import { UsersModule } from 'src/users/users.module';
import { RedisClientModule } from 'src/redisClient/redisClient.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Todos,
    ]),
    SharedspacesModule,
    RolesModule,
    UsersModule,
    RedisClientModule,
  ],
  controllers: [ TodosController ],
  providers: [
    TodosService,
  ],
  exports: [ TodosService ],
})

export class TodosModule {}