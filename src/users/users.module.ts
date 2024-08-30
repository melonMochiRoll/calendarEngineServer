import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Users } from 'src/entities/Users';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsUserAlreadyExistConstraint } from 'src/common/validator/IsUserAlreadyExist';
import { IsEmailAlreadyExistConstraint } from 'src/common/validator/IsEmailAlreadyExist';

@Module({
  imports: [ TypeOrmModule.forFeature([Users]) ],
  controllers: [ UsersController ],
  providers: [
    UsersService,
    IsUserAlreadyExistConstraint,
    IsEmailAlreadyExistConstraint,
  ],
  exports: [ UsersService ],
})

export class UsersModule {}