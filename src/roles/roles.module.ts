import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsExistRoleConstraint } from 'src/common/validator/IsExistRole';
import { Roles } from 'src/entities/Roles';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Roles,
    ]),
  ],
  controllers: [ RolesController ],
  providers: [
    RolesService,
    IsExistRoleConstraint,
  ],
  exports: [],
})

export class RolesModule {}