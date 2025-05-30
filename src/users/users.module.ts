import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Users } from 'src/entities/Users';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsExistUserConstraint } from 'src/common/validator/IsExistUser';
import { IsNotExistEmailConstraint } from 'src/common/validator/IsNotExistEmail';

@Module({
  imports: [ TypeOrmModule.forFeature([Users]) ],
  controllers: [ UsersController ],
  providers: [
    UsersService,
    IsExistUserConstraint,
    IsExistUserConstraint,
    IsNotExistEmailConstraint,
  ],
  exports: [ UsersService ],
})

export class UsersModule {}