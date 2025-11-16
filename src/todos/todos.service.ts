import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";
import { Todos } from "src/entities/Todos";
import { CreateTodoDTO } from "./dto/create.todo.dto";
import { UpdateTodoDto } from "./dto/update.todo.dto";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE } from "src/common/constant/error.message";
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

  async getTodosByDate(
    url: string,
    date: string,
    UserId?: number,
  ) {
    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      if (space.private) {
        const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

        if (!isParticipant) {
          throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
        }
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
    UserId?: number,
  ) {
    const [ year, month ] = date.split('-');
    const startDate = dayjs(`${year}-${month}-01`).toDate();
    const endDate = dayjs(`${year}-${month}-31`).toDate();

    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      if (space.private) {
        const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

        if (!isParticipant) {
          throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
        }
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

      const isMember = await this.rolesService.requireMember(UserId, space.id);

      if (!isMember) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      await this.todosRepository.save({
        ...dto,
        AuthorId: UserId,
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

      const isMember = await this.rolesService.requireMember(UserId, space.id);

      if (!isMember) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      const targetTodo = await this.todosRepository.findOneBy({ id: todoId });

      if (targetTodo?.SharedspaceId !== space.id) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      await this.todosRepository.update({ id: todoId }, {
        ...rest,
        EditorId: UserId,
      });
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

      const isMember = await this.rolesService.requireMember(UserId, space.id);

      if (!isMember) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

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
    page: number,
    UserId?: number,
    limit = 10,
  ) {
    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      if (space.private) {
        const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

        if (!isParticipant) {
          throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
        }
      }

      const todoRecords = await this.todosRepository.find({
        select: {
          id: true,
          description: true,
          date: true,
          startTime: true,
          endTime: true,
        },
        where: {
          SharedspaceId: space.id,
          description: Like(`%${query}%`),
        },
        order: {
          date: 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      const totalCount = await this.todosRepository.count({
        where: {
          SharedspaceId: space.id,
          description: Like(`%${query}%`),
        },
      });

      return {
        items: todoRecords,
        hasMoreData: !Boolean(page * limit >= totalCount),
      };
    } catch (err) {
      handleError(err);
    }
  }
}