import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspacesController } from './sharedspaces.controller';
import { SharedspacesService } from './sharedspaces.service';
import { IsExistSpaceConstraint } from 'src/common/validator/IsExistSpace';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { TodosModule } from 'src/todos/todos.module';
import { PublicSpaceGuard } from 'src/common/guard/public.space.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sharedspaces,
      SharedspaceMembers,
    ]),
    TodosModule,
  ],
  controllers: [ SharedspacesController ],
  providers: [
    SharedspacesService,
    IsExistSpaceConstraint,
    PublicSpaceGuard,
    RolesGuard,
  ],
  exports: [
    SharedspacesService,
  ],
})

export class SharedspacesModule {}