import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDTO } from './dto/create.todo.dto';
import { UpdateTodoDto } from './dto/update.todo.dto';
import { AboveMemberRoles } from 'src/common/decorator/above.member.decorator';
import { AuthRoleGuards } from 'src/common/decorator/auth.role.decorator';
import { HeaderProperty } from 'src/common/decorator/headerProperty.decorator';
import { PublicSpaceGuard } from 'src/common/guard/public.space.guard';
import { DateValidationPipe } from 'src/common/pipe/date.validation.pipe';

@Controller('api/sharedspaces')
export class TodosController {
  constructor(
    private todosService: TodosService,
  ) {}

  @UseGuards(PublicSpaceGuard)
  @Get(':url/todos')
  getTodosBySpace(
    @Param('url') url: string,
    @Query('date', DateValidationPipe) date: string,
  ) {
    return this.todosService.getTodosBySpace(
      url,
      date,
    );
  }

  @AuthRoleGuards()
  @AboveMemberRoles()
  @Post(':url/todos')
  createTodo(
    @Body() dto: CreateTodoDTO,
    @HeaderProperty('sharedspace-id', ParseIntPipe) SharedspaceId: number,
  ) {
    return this.todosService.createTodo(dto, SharedspaceId);
  }

  @AuthRoleGuards()
  @AboveMemberRoles()
  @Put(':url/todos')
  updateTodo(@Body() dto: UpdateTodoDto) {
    return this.todosService.updateTodo(dto);
  }

  @AuthRoleGuards()
  @AboveMemberRoles()
  @HttpCode(204)
  @Delete(':url/todos/:id')
  deleteTodo(@Param('id', ParseIntPipe) todoId: number) {
    return this.todosService.deleteTodo(todoId);
  }

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