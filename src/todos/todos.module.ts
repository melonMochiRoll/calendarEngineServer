import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todos } from 'src/entities/Todos';
import { IsExistTodoConstraint } from 'src/common/validator/IsExistTodo';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { RefreshTokens } from 'src/entities/RefreshTokens';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Todos,
      Sharedspaces,
      RefreshTokens,
      SharedspaceMembers,
    ]),
    SharedspacesModule,
    RolesModule,
  ],
  controllers: [ TodosController ],
  providers: [
    TodosService,
    IsExistTodoConstraint,
  ],
  exports: [ TodosService ],
})

export class TodosModule {}