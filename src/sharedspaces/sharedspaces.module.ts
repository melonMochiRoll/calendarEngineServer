import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspacesController } from './sharedspaces.controller';
import { SharedspacesService } from './sharedspaces.service';

@Module({
  imports: [ TypeOrmModule.forFeature([Sharedspaces]) ],
  controllers: [ SharedspacesController ],
  providers: [ SharedspacesService ],
  exports: [],
})

export class SharedspacesModule {}