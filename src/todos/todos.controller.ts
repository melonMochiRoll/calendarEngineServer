import { Body, Controller, Delete, Get, HttpCode, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { TodosService } from './todos.service';
import { User } from 'src/common/decorator/user.decorator';
import { Users } from 'src/entities/Users';
import { IsAuthenicatedGuard } from 'src/auth/local.auth.guard';
import { CreateTodoDTO } from './dto/create.todo.dto';
import { UpdateTodoDto } from './dto/update.todo.dto';

// @UseGuards(IsAuthenicatedGuard)
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
    // return this.todosService.getTodos(
    //   date,
    //   user.id,
    // );
  };

  @Get('list')
  getCurrentMonthTodosList(
    @Query('date') date: string,
    @User() user: Users,
  ) {
    // return this.todosService.getCurrentMonthTodosList(
    //   date,
    //   user.id,
    // );
  };

  @Post()
  createTodo(@Body() dto: CreateTodoDTO) {
    return this.todosService.createTodo(dto);
  };

  @Put()
  updateTodo(@Body() dto: UpdateTodoDto) {
    return this.todosService.updateTodo(dto);
  };

  @Delete()
  @HttpCode(204)
  deleteDateTodos(
    @Query('ti', ParseIntPipe) todosId: number,
    @Query('date') date: string,
    @User() user: Users,
  ) {
    // return this.todosService.deleteDateTodos(
    //   todosId,
    //   date,
    //   user.id
    // );
  }

  @Get('search')
  searchTodos(
    @Query('query') query: string,
    @Query('offset', ParseIntPipe) offset: number,
    @Query('limit', ParseIntPipe) limit: number,
    @User() user: Users,
  ) {
    // return this.todosService.searchTodos(
    //   query,
    //   offset,
    //   limit,
    //   user.id,
    // );
  }
}

// TODO : 테이블 구조 변경에 따른 로직 수정 필요
// TODO : 로직 수정에 따른 캐싱 전략 수정 필요