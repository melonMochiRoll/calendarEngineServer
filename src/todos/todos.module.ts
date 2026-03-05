import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todos } from 'src/entities/Todos';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { RefreshTokens } from 'src/entities/RefreshTokens';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';
import { RolesModule } from 'src/roles/roles.module';
import { UsersModule } from 'src/users/users.module';

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
    UsersModule,
  ],
  controllers: [ TodosController ],
  providers: [
    TodosService,
  ],
  exports: [ TodosService ],
})

export class TodosModule {}