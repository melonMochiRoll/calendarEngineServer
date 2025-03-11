import { BadRequestException, Injectable } from "@nestjs/common";
import dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { And, Brackets, DataSource, LessThanOrEqual, Like, MoreThanOrEqual, Repository } from "typeorm";
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

  async getTodosByDate(
    targetSpace: Sharedspaces,
    date: string,
  ) {
    try {
      return await this.todosRepository
        .createQueryBuilder('todos')
        .leftJoinAndSelect('todos.Author', 'Author')
        .leftJoinAndSelect('todos.Editor', 'Editor')
        .where('todos.SharedspaceId = :SharedspaceId', { SharedspaceId: targetSpace.id })
        .andWhere('todos.date = :date', { date })
        .orderBy('todos.startTime')
        .addOrderBy('todos.endTime')
        .getMany();
    } catch (err) {
      handleError(err);
    }
  }

  async getTodosCount(
    targetSpace: Sharedspaces,
    date: string,
  ) {
    const [ year, month ] = date.split('-');
    const startDate = dayjs(`${year}-${month}-01`).toDate();
    const endDate = dayjs(`${year}-${month}-31`).toDate();

    try {
      const result = await this.todosRepository
        .createQueryBuilder('todos')
        .select("DATE_FORMAT(todos.date, '%Y-%m-%d') AS date")
        .addSelect('COUNT(*) AS count')
        .where('todos.SharedspaceId = :SharedspaceId', { SharedspaceId: targetSpace.id })
        .andWhere('todos.date >= :startDate', { startDate })
        .andWhere('todos.date <= :endDate', { endDate })
        .groupBy('todos.date')
        .getRawMany();

      return result
        .reduce((acc: object, item: { date: string, count: string }) => {
          acc[item.date] = +item.count;
          return acc;
        }, {});
    } catch (err) {
      handleError(err);
    }
  }

  async getTodosByQuery(
    url: string,
    query: string,
    offset: number,
    limit: number,
  ) {
    try {
      return await this.todosRepository.find({
        select: {
          id: true,
          description: true,
          date: true,
          startTime: true,
          endTime: true,
          Sharedspace: {
            url: true,
          },
        },
        relations: {
          Sharedspace: true,
        },
        where: {
          Sharedspace: {
            url,
          },
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
    targetSpace: Sharedspaces,
    date: string,
  ) {
    try {
      const todos = await this.getTodos(targetSpace.id, date);

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
    targetSpace: Sharedspaces,
    dto: CreateTodoDTO,
  ) {
    try {
      await this.todosRepository.save({
        ...dto,
        SharedspaceId: targetSpace.id,
      });
    } catch (err: any) {
      handleError(err);
    }

    return true;
  }

  async updateTodo(
    targetSpace: Sharedspaces,
    dto: UpdateTodoDto,
  ) {
    const { id: todoId, ...rest } = dto;

    try {
      const targetTodo = await this.todosRepository.findOneBy({ id: todoId });

      if (targetTodo?.SharedspaceId !== targetSpace.id) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      await this.todosRepository.update({ id: todoId }, rest);
    } catch (err: any) {
      handleError(err);
    }

    return true;
  }

  async deleteTodo(
    targetSpace: Sharedspaces,
    todoId: number,
  ) {
    try {
      const targetTodo = await this.todosRepository.findOneBy({ id: todoId });

      if (targetTodo?.SharedspaceId !== targetSpace.id) {
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
      return await this.getTodosByQuery(
        url,
        query,
        offset,
        limit,
      );
    } catch (err) {
      handleError(err);
    }
  }
}