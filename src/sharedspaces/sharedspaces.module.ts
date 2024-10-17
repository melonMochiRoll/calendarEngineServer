import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspacesController } from './sharedspaces.controller';
import { SharedspacesService } from './sharedspaces.service';
import { IsExistSpaceConstraint } from 'src/common/validator/IsExistSpace';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { TodosModule } from 'src/todos/todos.module';
import { PublicSpaceGuard } from 'src/common/guard/public.space.guard';

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
  ],
  exports: [
    SharedspacesService,
  ],
})

export class SharedspacesModule {}