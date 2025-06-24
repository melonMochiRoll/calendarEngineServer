import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDTO } from './dto/create.todo.dto';
import { UpdateTodoDto } from './dto/update.todo.dto';
import { AboveMemberRoles } from 'src/common/decorator/above.member.decorator';
import { AuthRoleGuards } from 'src/common/decorator/auth.role.decorator';
import { PublicSpaceGuard } from 'src/common/guard/public.space.guard';
import { DateValidationPipe } from 'src/common/pipe/date.validation.pipe';
import { TransformSpacePipe } from 'src/common/pipe/transform.space.pipe';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { JwtAuthGuard } from 'src/auth/authGuard/jwt.auth.guard';

@Controller('api/sharedspaces')
export class TodosController {
  constructor(
    private todosService: TodosService,
  ) {}

  @UseGuards(JwtAuthGuard, PublicSpaceGuard)
  @Get(':url/todos')
  getTodosByDate(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Query('date', DateValidationPipe) date: string,
  ) {
    return this.todosService.getTodosByDate(
      targetSpace,
      date,
    );
  }

  @UseGuards(JwtAuthGuard, PublicSpaceGuard)
  @Get(':url/todos/count')
  getTodosCount(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Query('date', DateValidationPipe) date: string,
  ) {
    return this.todosService.getTodosCount(
      targetSpace,
      date,
    );
  }

  @AuthRoleGuards()
  @AboveMemberRoles()
  @Post(':url/todos')
  createTodo(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: CreateTodoDTO,
  ) {
    return this.todosService.createTodo(targetSpace, dto);
  }

  @AuthRoleGuards()
  @AboveMemberRoles()
  @Put(':url/todos')
  updateTodo(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: UpdateTodoDto,
  ) {
    return this.todosService.updateTodo(
      targetSpace,
      dto,
    );
  }

  @AuthRoleGuards()
  @AboveMemberRoles()
  @HttpCode(204)
  @Delete(':url/todos/:id')
  deleteTodo(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Param('id', ParseIntPipe) todoId: number,
  ) {
    return this.todosService.deleteTodo(targetSpace, todoId);
  }

  @UseGuards(JwtAuthGuard, PublicSpaceGuard)
  @Get(':url/todos/search')
  searchTodos(
    @Param('url') url: string,
    @Query('query') query: string,
    @Query('offset', ParseIntPipe) offset: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.todosService.searchTodos(
      url,
      query,
      offset,
      limit,
    );
  }
}