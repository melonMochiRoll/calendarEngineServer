import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from 'src/entities/Roles';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Roles,
      SharedspaceMembers,
    ]),
  ],
  controllers: [ RolesController ],
  providers: [
    RolesService,
  ],
  exports: [
    RolesService,
  ],
})

export class RolesModule {}