import { HttpException, Injectable, InternalServerErrorException } from "@nestjs/common";
import dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { And, LessThanOrEqual, Like, MoreThanOrEqual, Repository } from "typeorm";
import { Todos } from "src/entities/Todos";
import { CreateTodoDTO } from "./dto/create.todo.dto";

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todos)
    private todosRepository: Repository<Todos>,
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

  async createTodo(dto: CreateTodoDTO) {
    try {
      await this.todosRepository.save({ ...dto });

      return true;
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }
  }

  async updateTodo(dto: any) {
    const { id, rest } = dto;

    try {
      await this.todosRepository.update({ id }, { ...rest });

      return true;
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }
  }

  async deleteTodo(todoId: number) {
    try {
      await this.todosRepository.delete(todoId);

      return true;
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }
  }
}