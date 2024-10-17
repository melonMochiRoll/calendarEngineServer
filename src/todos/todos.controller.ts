import { Body, Controller, Delete, HttpCode, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDTO } from './dto/create.todo.dto';
import { UpdateTodoDto } from './dto/update.todo.dto';
import { AboveMemberRoles } from 'src/common/decorator/above.member.decorator';
import { AuthRoleGuards } from 'src/common/decorator/auth.role.decorator';
import { HeaderProperty } from 'src/common/decorator/headerProperty.decorator';

@Controller('api/todos')
export class TodosController {
  constructor(
    private todosService: TodosService,
  ) {}

  @AuthRoleGuards()
  @AboveMemberRoles()
  @Post()
  createTodo(
    @Body() dto: CreateTodoDTO,
    @HeaderProperty('sharedspace-id', ParseIntPipe) SharedspaceId: number,
  ) {
    return this.todosService.createTodo(dto, SharedspaceId);
  }

  @AuthRoleGuards()
  @AboveMemberRoles()
  @Put()
  updateTodo(@Body() dto: UpdateTodoDto) {
    return this.todosService.updateTodo(dto);
  }

  @AuthRoleGuards()
  @AboveMemberRoles()
  @HttpCode(204)
  @Delete()
  deleteTodo(@Query('ti', ParseIntPipe) todoId: number) {
    return this.todosService.deleteTodo(todoId);
  }
}