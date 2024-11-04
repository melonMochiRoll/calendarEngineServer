import { BadRequestException, HttpException, Injectable, InternalServerErrorException } from "@nestjs/common";
import dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { And, LessThanOrEqual, Like, MoreThanOrEqual, Repository } from "typeorm";
import { Todos } from "src/entities/Todos";
import { CreateTodoDTO } from "./dto/create.todo.dto";
import { UpdateTodoDto } from "./dto/update.todo.dto";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { BAD_REQUEST_MESSAGE } from "src/common/constant/error.message";
import handleError from "src/common/function/handleError";

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todos)
    private todosRepository: Repository<Todos>,
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
  ) {}

  async getTodos(
    SharedspaceId: number,
    date: string,
  ) {
    const [ year, month ] = date.split('-');

    try {
      const startDate = dayjs(`${year}-${month}-01`).toDate();
      const endDate = dayjs(`${year}-${month}-31`).toDate();

      return await this.todosRepository.find({
        select: {
          Author: {
            email: true,
          },
          Editor: {
            email: true,
          },
        },
        relations: {
          Author: true,
          Editor: true,
        },
        where: {
          SharedspaceId,
          date: And(
            MoreThanOrEqual(startDate),
            LessThanOrEqual(endDate)
          ),
        },
      });
    } catch (err) {
      handleError(err);
    }
  }

  async getTodosByQuery(
    SharedspaceId: number,
    query: string,
    offset: number,
    limit: number,
  ) {
    try {
      return await this.todosRepository.find({
        select: {
          description: true,
          date: true,
          startTime: true,
          endTime: true,
        },
        where: {
          SharedspaceId,
          description: Like(`%${query}%`),
        },
        order: {
          date: 'DESC',
        },
        skip: (offset - 1) * limit,
        take: limit,
      });
    } catch (err) {
      handleError(err);
    }
  }

  async getTodosBySpace(
    url: string,
    date: string,
  ) {
    try {
      const targetspace = await this.sharedspacesRepository.findOneBy({ url });
      const todos = await this.getTodos(targetspace.id, date);

      const result = todos
        .sort((a: Todos, b: Todos) => {
          if (a.date > b.date) {
            return 1;
          }

          if (a.date < b.date) {
            return -1;
          }

          if (a.startTime > b.startTime) {
            return 1;
          }

          if (a.startTime < b.startTime) {
            return -1;
          }

          if (a.endTime > b.endTime) {
            return 1;
          }

          if (a.endTime < b.endTime) {
            return -1;
          }

          return 0;
        })  
        .reduce((acc: object, todo: Todos) => {
          const dateStr = String(todo.date);

          if (acc[dateStr]) {
            acc[dateStr].push(todo);
            return acc;
          }

          acc[dateStr] = [ todo ];
          return acc;
        }, {});

      return result;
    } catch (err) {
      handleError(err);
    }
  }

  async createTodo(
    dto: CreateTodoDTO,
    url: string,
  ) {
    try {
      const targetSpace = await this.sharedspacesRepository.findOneBy({ url });

      await this.todosRepository.save({
        ...dto,
        SharedspaceId: targetSpace?.id,
      });
    } catch (err: any) {
      handleError(err);
    }

    return true;
  }

  async updateTodo(
    dto: UpdateTodoDto,
    url: string,
  ) {
    const { id: todoId, ...rest } = dto;

    try {
      const targetSpace = await this.sharedspacesRepository.findOneBy({ url });
      const targetTodo = await this.todosRepository.findOneBy({ id: todoId });

      if (targetTodo?.SharedspaceId !== targetSpace?.id) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      await this.todosRepository.update({ id: todoId }, rest);
    } catch (err: any) {
      handleError(err);
    }

    return true;
  }

  async deleteTodo(
    url: string,
    todoId: number,
  ) {
    try {
      const targetSpace = await this.sharedspacesRepository.findOneBy({ url });
      const targetTodo = await this.todosRepository.findOneBy({ id: todoId });

      if (targetTodo?.SharedspaceId !== targetSpace?.id) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      await this.todosRepository.delete(todoId);
    } catch (err: any) {
      handleError(err);
    }

    return true;
  }

  async searchTodos(
    url: string,
    query: string,
    offset: number,
    limit: number,
  ) {
    try {

      // return await this.todosService.getTodosByQuery(
      //   SharedspaceId,
      //   query,
      //   offset,
      //   limit,
      // );
    } catch (err) {
      handleError(err);
    }
  }
}