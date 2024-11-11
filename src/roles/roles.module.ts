import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from 'src/entities/Roles';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Roles,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})

export class RolesModule {}