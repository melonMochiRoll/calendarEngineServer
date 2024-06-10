import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateDateTodosDto } from './dto/createDateTodos.dto';
import { UpdateDateTodosDto } from './dto/updateDateTodos.dto';
import { User } from 'src/common/decorator/user.decorator';
import { Users } from 'src/entities/Users';
import { IsAuthenicatedGuard } from 'src/auth/local.auth.guard';

@UseGuards(IsAuthenicatedGuard)
@Controller('api/todos')
export class TodosController {
  constructor(
    private todosService: TodosService,
  ) {}

  @Get()
  getTodos(
    @Query('date') date: string,
    @User() user: Users,
  ) {
    return this.todosService.getTodos(
      date,
      user.id,
    );
  };

  @Get('list')
  getCurrentMonthTodosList(
    @Query('date') date: string,
    @User() user: Users,
  ) {
    return this.todosService.getCurrentMonthTodosList(
      date,
      user.id,
    );
  };

  @Post()
  createDateTodos(
    @Body() dto: CreateDateTodosDto,
    @User() user: Users,
  ) {
    return this.todosService.createDateTodos(
      dto.contents,
      dto.date,
      user.id,
    );
  };

  @Put()
  updateDateTodos(
    @Body() dto: UpdateDateTodosDto,
    @User() user: Users,
  ) {
    return this.todosService.updateDateTodos(
      dto.todosId,
      dto.contents,
      dto.isComplete,
      dto.date,
      user.id
    );
  };

  @Delete()
  @HttpCode(204)
  deleteDateTodos(
    @Query('ti', ParseIntPipe) todosId: number,
    @Query('date') date: string,
    @User() user: Users,
  ) {
    return this.todosService.deleteDateTodos(
      todosId,
      date,
      user.id
    );
  }
}