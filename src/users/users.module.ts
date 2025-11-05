import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Users } from 'src/entities/Users';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokens } from 'src/entities/RefreshTokens';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { SharedspacesModule } from 'src/sharedspaces/sharedspaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      RefreshTokens,
      SharedspaceMembers,
    ]),
    SharedspacesModule,
  ],
  controllers: [ UsersController ],
  providers: [
    UsersService,
  ],
  exports: [ UsersService ],
})

export class UsersModule {}