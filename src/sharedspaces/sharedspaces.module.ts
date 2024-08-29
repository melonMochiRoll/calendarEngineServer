import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspacesController } from './sharedspaces.controller';
import { SharedspacesService } from './sharedspaces.service';
import { IsSpaceAlreadyExistConstraint } from 'src/common/validator/IsSpaceAlreadyExist';

@Module({
  imports: [ TypeOrmModule.forFeature([Sharedspaces]) ],
  controllers: [ SharedspacesController ],
  providers: [
    SharedspacesService,
    IsSpaceAlreadyExistConstraint,
  ],
  exports: [],
})

export class SharedspacesModule {}