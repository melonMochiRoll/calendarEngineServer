import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
  ],
  exports: [],
})

export class RolesModule {}