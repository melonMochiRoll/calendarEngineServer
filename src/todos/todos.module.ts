import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todos } from 'src/entities/Todos';

@Module({
  imports: [ TypeOrmModule.forFeature([Todos]) ],
  controllers: [ TodosController ],
  providers: [ TodosService ],
})

export class TodosModule {}