import { Body, Controller, Delete, Get, HttpCode, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { TodosService } from './todos.service';
import { User } from 'src/common/decorator/user.decorator';
import { Users } from 'src/entities/Users';
import { CreateTodoDTO } from './dto/create.todo.dto';
import { UpdateTodoDto } from './dto/update.todo.dto';
import { AboveMemberRoles } from 'src/common/decorator/above.member.decorator';
import { AuthRoleGuards } from 'src/common/decorator/auth.role.decorator';

@Controller('api/todos')
export class TodosController {
  constructor(
    private todosService: TodosService,
  ) {}

  @AuthRoleGuards()
  @AboveMemberRoles()
  @Post()
  createTodo(@Body() dto: CreateTodoDTO) {
    return this.todosService.createTodo(dto);
  };

  @AuthRoleGuards()
  @AboveMemberRoles()
  @Put()
  updateTodo(@Body() dto: UpdateTodoDto) {
    return this.todosService.updateTodo(dto);
  };

  @AuthRoleGuards()
  @AboveMemberRoles()
  @HttpCode(204)
  @Delete()
  deleteTodo(@Query('ti', ParseIntPipe) todoId: number) {
    return this.todosService.deleteTodo(todoId);
  }

  // @Get('search')
  // searchTodos( // TODO: 검색 전략 고민
  //   @Query('query') query: string,
  //   @Query('offset', ParseIntPipe) offset: number,
  //   @Query('limit', ParseIntPipe) limit: number,
  //   @User() user: Users,
  // ) {
  //   // return this.todosService.searchTodos(
  //   //   query,
  //   //   offset,
  //   //   limit,
  //   //   user.id,
  //   // );
  // }
}

// TODO : 로직 수정에 따른 캐싱 전략 수정 필요