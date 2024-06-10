import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Users } from 'src/entities/Users';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [ TypeOrmModule.forFeature([Users]) ],
  controllers: [ UsersController ],
  providers: [ UsersService ],
  exports: [ UsersService ],
})

export class UsersModule {}