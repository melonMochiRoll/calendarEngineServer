import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDTO } from './dto/create.todo.dto';
import { UpdateTodoDto } from './dto/update.todo.dto';
import { DateValidationPipe } from 'src/common/pipe/date.validation.pipe';
import { JwtAuthGuard, PublicAuthGuard } from 'src/auth/authGuard/jwt.auth.guard';
import { CSRFAuthGuard } from 'src/auth/authGuard/csrf.auth.guard';
import { Users } from 'src/entities/Users';
import { User } from 'src/common/decorator/user.decorator';
import { UUIDv7ValidationPipe } from 'src/common/pipe/uuidv7.validation.pipe';
import { UUIDv7OrEmptyPipe } from 'src/common/pipe/uuidv7OrEmpty.pipe';

@Controller('api/sharedspaces')
export class TodosController {
  constructor(
    private todosService: TodosService,
  ) {}

  @UseGuards(PublicAuthGuard)
  @Get(':SharedspaceId/todos')
  getTodosByMonth(
    @Param('SharedspaceId') SharedspaceId: string,
    @Query('date', DateValidationPipe) date: string,
    @User() user: Users,
  ) {
    return this.todosService.getTodosByMonth(
      SharedspaceId,
      date,
      user?.id,
    );
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':SharedspaceId/todos')
  createTodo(
    @Param('SharedspaceId') SharedspaceId: string,
    @Body() dto: CreateTodoDTO,
    @User() user: Users,
  ) {
    return this.todosService.createTodo(SharedspaceId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Put(':SharedspaceId/todos')
  updateTodo(
    @Param('SharedspaceId') SharedspaceId: string,
    @Body() dto: UpdateTodoDto,
    @User() user: Users,
  ) {
    return this.todosService.updateTodo(SharedspaceId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @HttpCode(204)
  @Delete(':SharedspaceId/todos/:id')
  deleteTodo(
    @Param('SharedspaceId') SharedspaceId: string,
    @Param('id', UUIDv7ValidationPipe) todoId: string,
    @User() user: Users,
  ) {
    return this.todosService.deleteTodo(SharedspaceId, todoId, user.id);
  }

  @UseGuards(PublicAuthGuard)
  @Get(':SharedspaceId/todos/search')
  searchTodos(
    @Param('SharedspaceId') SharedspaceId: string,
    @Query('query') query: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeTodoId: string,
    @User() user: Users,
  ) {
    return this.todosService.searchTodos(
      SharedspaceId,
      query,
      beforeTodoId,
      user?.id,
    );
  }
}