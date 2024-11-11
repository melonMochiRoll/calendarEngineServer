import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsExistRoleConstraint } from 'src/common/validator/IsExistRole';
import { Roles } from 'src/entities/Roles';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Roles,
    ]),
  ],
  controllers: [],
  providers: [
    IsExistRoleConstraint,
  ],
  exports: [],
})

export class RolesModule {}