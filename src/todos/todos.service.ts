import { HttpException, Injectable, InternalServerErrorException } from "@nestjs/common";
import dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { And, LessThanOrEqual, Like, MoreThanOrEqual, Repository } from "typeorm";
import { Todos } from "src/entities/Todos";
import { CreateTodoDTO } from "./dto/create.todo.dto";
import { UpdateTodoDto } from "./dto/update.todo.dto";
import { Sharedspaces } from "src/entities/Sharedspaces";

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
        where: {
          SharedspaceId,
          date: And(
            MoreThanOrEqual(startDate),
            LessThanOrEqual(endDate)
          ),
        },
      });
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
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
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
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
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }
  }

  async createTodo(
    dto: CreateTodoDTO,
    url: string,
  ) {
    try {
      const targetspace = await this.sharedspacesRepository.findOneBy({ url });

      await this.todosRepository.save({
        ...dto,
        SharedspaceId: targetspace?.id,
      });
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }

    return true;
  }

  async updateTodo(dto: UpdateTodoDto) {
    const { id, ...rest } = dto;

    try {
      await this.todosRepository.update({ id }, rest);
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }

    return true;
  }

  async deleteTodo(todoId: number) {
    try {
      await this.todosRepository.delete(todoId);
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
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
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }
  }
}