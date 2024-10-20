import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDTO } from './dto/create.todo.dto';
import { UpdateTodoDto } from './dto/update.todo.dto';
import { AboveMemberRoles } from 'src/common/decorator/above.member.decorator';
import { AuthRoleGuards } from 'src/common/decorator/auth.role.decorator';
import { HeaderProperty } from 'src/common/decorator/headerProperty.decorator';

@Controller('api/sharedspaces')
export class TodosController {
  constructor(
    private todosService: TodosService,
  ) {}

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
}