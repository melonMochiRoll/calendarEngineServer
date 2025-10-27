import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { And, LessThanOrEqual, Like, MoreThanOrEqual, Repository } from "typeorm";
import { Todos } from "src/entities/Todos";
import { CreateTodoDTO } from "./dto/create.todo.dto";
import { UpdateTodoDto } from "./dto/update.todo.dto";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, UNAUTHORIZED_MESSAGE } from "src/common/constant/error.message";
import handleError from "src/common/function/handleError";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { RolesService } from "src/roles/roles.service";

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todos)
    private todosRepository: Repository<Todos>,
    private sharedspacesService: SharedspacesService,
    private rolesService: RolesService,
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
    url: string,
    date: string,
    UserId?: number,
  ) {
    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      if (!space) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      if (!UserId && space.private) {
        throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
      }

      const userRole = await this.rolesService.getUserRole(UserId, space.id);

      if (!userRole && space.private) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      return await this.todosRepository
        .createQueryBuilder('todos')
        .leftJoinAndSelect('todos.Author', 'Author')
        .leftJoinAndSelect('todos.Editor', 'Editor')
        .where('todos.SharedspaceId = :SharedspaceId', { SharedspaceId: space.id })
        .andWhere('todos.date = :date', { date })
        .orderBy('todos.startTime')
        .addOrderBy('todos.endTime')
        .getMany();
    } catch (err) {
      handleError(err);
    }
  }

  async getTodosCount(
    url: string,
    date: string,
  ) {
    const [ year, month ] = date.split('-');
    const startDate = dayjs(`${year}-${month}-01`).toDate();
    const endDate = dayjs(`${year}-${month}-31`).toDate();

    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      if (!space) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const result = await this.todosRepository
        .createQueryBuilder('todos')
        .select("DATE_FORMAT(todos.date, '%Y-%m-%d') AS date")
        .addSelect('COUNT(*) AS count')
        .where('todos.SharedspaceId = :SharedspaceId', { SharedspaceId: space.id })
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

  async createTodo(
    url: string,
    dto: CreateTodoDTO,
    UserId: number,
  ) {
    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      await this.rolesService.requireMember(UserId, space.id);

      await this.todosRepository.save({
        ...dto,
        SharedspaceId: space.id,
      });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async updateTodo(
    url: string,
    dto: UpdateTodoDto,
    UserId: number,
  ) {
    const { id: todoId, ...rest } = dto;

    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      await this.rolesService.requireMember(UserId, space.id);

      const targetTodo = await this.todosRepository.findOneBy({ id: todoId });

      if (targetTodo?.SharedspaceId !== space.id) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      await this.todosRepository.update({ id: todoId }, rest);
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async deleteTodo(
    url: string,
    todoId: number,
    UserId: number,
  ) {
    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      await this.rolesService.requireMember(UserId, space.id);

      const targetTodo = await this.todosRepository.findOneBy({ id: todoId });

      if (targetTodo?.SharedspaceId !== space.id) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      await this.todosRepository.delete(todoId);
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async searchTodos(
    url: string,
    query: string,
    offset: number,
    limit = 10,
    UserId?: number,
  ) {
    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      if (space.private) {
        await this.rolesService.requireParticipant(UserId, space.id);
      }

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