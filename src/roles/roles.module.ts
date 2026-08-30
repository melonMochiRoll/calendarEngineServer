import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from 'src/entities/Roles';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { SpaceMembers } from 'src/entities/SpaceMembers';
import { RedisClientModule } from 'src/redisClient/redisClient.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Roles,
      SpaceMembers,
    ]),
    RedisClientModule,
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