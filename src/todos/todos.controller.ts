import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDTO } from './dto/create.todo.dto';
import { UpdateTodoDto } from './dto/update.todo.dto';
import { DateValidationPipe } from 'src/common/pipe/date.validation.pipe';
import { JwtAuthGuard, PublicAuthGuard } from 'src/auth/authGuard/jwt.auth.guard';
import { CSRFAuthGuard } from 'src/auth/authGuard/csrf.auth.guard';
import { Users } from 'src/entities/Users';
import { User } from 'src/common/decorator/user.decorator';

@Controller('api/sharedspaces')
export class TodosController {
  constructor(
    private todosService: TodosService,
  ) {}

  @UseGuards(PublicAuthGuard)
  @Get(':url/todos')
  getTodosByDate(
    @Param('url') url: string,
    @Query('date', DateValidationPipe) date: string,
    @User() user: Users,
  ) {
    return this.todosService.getTodosByDate(
      url,
      date,
      user?.id,
    );
  }

  @UseGuards(PublicAuthGuard)
  @Get(':url/todos/count')
  getTodosCount(
    @Param('url') url: string,
    @Query('date', DateValidationPipe) date: string,
  ) {
    return this.todosService.getTodosCount(
      url,
      date,
    );
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':url/todos')
  createTodo(
    @Param('url') url: string,
    @Body() dto: CreateTodoDTO,
    @User() user: Users,
  ) {
    return this.todosService.createTodo(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Put(':url/todos')
  updateTodo(
    @Param('url') url: string,
    @Body() dto: UpdateTodoDto,
    @User() user: Users,
  ) {
    return this.todosService.updateTodo(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @HttpCode(204)
  @Delete(':url/todos/:id')
  deleteTodo(
    @Param('url') url: string,
    @Param('id', ParseIntPipe) todoId: number,
    @User() user: Users,
  ) {
    return this.todosService.deleteTodo(url, todoId, user.id);
  }

  @UseGuards(PublicAuthGuard)
  @Get(':url/todos/search')
  searchTodos(
    @Param('url') url: string,
    @Query('query') query: string,
    @Query('offset', ParseIntPipe) offset: number,
    @User() user: Users,
  ) {
    return this.todosService.searchTodos(
      url,
      query,
      offset,
      user?.id,
    );
  }
}