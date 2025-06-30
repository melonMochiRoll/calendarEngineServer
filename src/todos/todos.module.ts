import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todos } from 'src/entities/Todos';
import { IsExistTodoConstraint } from 'src/common/validator/IsExistTodo';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { RefreshTokens } from 'src/entities/RefreshTokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Todos,
      Sharedspaces,
      RefreshTokens,
    ]),
  ],
  controllers: [ TodosController ],
  providers: [
    TodosService,
    IsExistTodoConstraint,
  ],
  exports: [ TodosService ],
})

export class TodosModule {}