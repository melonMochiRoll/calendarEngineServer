import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todos } from 'src/entities/Todos';
import { IsExistTodoConstraint } from 'src/common/validator/IsExistTodo';
import { Sharedspaces } from 'src/entities/Sharedspaces';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Todos,
      Sharedspaces,
    ])
  ],
  controllers: [ TodosController ],
  providers: [
    TodosService,
    IsExistTodoConstraint,
  ],
})

export class TodosModule {}