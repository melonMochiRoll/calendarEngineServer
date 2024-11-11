import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspacesController } from './sharedspaces.controller';
import { SharedspacesService } from './sharedspaces.service';
import { IsExistSpaceConstraint } from 'src/common/validator/IsExistSpace';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { TodosModule } from 'src/todos/todos.module';
import { PublicSpaceGuard } from 'src/common/guard/public.space.guard';
import { Roles } from 'src/entities/Roles';
import { TransformSpacePipe } from 'src/common/pipe/transform.space.pipe';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sharedspaces,
      SharedspaceMembers,
      Roles,
    ]),
    TodosModule,
  ],
  controllers: [ SharedspacesController ],
  providers: [
    SharedspacesService,
    IsExistSpaceConstraint,
    PublicSpaceGuard,
    TransformSpacePipe,
  ],
  exports: [
    SharedspacesService,
  ],
})

export class SharedspacesModule {}