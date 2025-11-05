import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Users } from 'src/entities/Users';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokens } from 'src/entities/RefreshTokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      RefreshTokens,
    ]),
  ],
  controllers: [ UsersController ],
  providers: [
    UsersService,
  ],
  exports: [ UsersService ],
})

export class UsersModule {}