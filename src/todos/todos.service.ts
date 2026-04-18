import { BadRequestException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, IsNull, Like, Repository } from "typeorm";
import { Todos } from "src/entities/Todos";
import { CreateTodoDTO } from "./dto/create.todo.dto";
import { UpdateTodoDto } from "./dto/update.todo.dto";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE } from "src/common/constant/error.message";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { RolesService } from "src/roles/roles.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { CACHE_EMPTY_SYMBOL } from "src/common/constant/constants";

@Injectable()
export class TodosService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(Todos)
    private todosRepository: Repository<Todos>,
    private sharedspacesService: SharedspacesService,
    private rolesService: RolesService,
  ) {}

  async getTodosByMonth(
    url: string,
    date: string,
    UserId?: number,
  ) {
    const [ year, month ] = date.split('-');
    const startDate = dayjs(`${year}-${month}-01`).toDate();
    const endDate = dayjs(`${year}-${month}-31`).toDate();

    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    if (space.private) {
      const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

      if (!isParticipant) {
        throw new ForbiddenException({
          message: ACCESS_DENIED_MESSAGE,
          metaData: { spaceUrl: space.url },
        });
      }
    }

    const cacheKey = `todos:${space.url}:${year}-${month}`;

    const cachedItem = await this.cacheManager.get<Todos[] | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (cachedItem) {
      if (cachedItem === CACHE_EMPTY_SYMBOL) {
        return null;
      }

      const cachedTodosMap = cachedItem.reduce((map, todo) => {
        if (!map[String(todo.date)]) {
          map[String(todo.date)] = [];
        }
        map[String(todo.date)].push(todo);
        return map;
      }, {});

      return cachedTodosMap;
    }

    const todos = await this.todosRepository.find({
      select: {
        id: true,
        description: true,
        date: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        updatedAt: true,
        Author: {
          nickname: true,
        },
        Editor: {
          nickname: true,
        },
      },
      relations: {
        Author: true,
        Editor: true,
      },
      where: {
        SharedspaceId: space.id,
        date: Between(startDate, endDate),
        removedAt: IsNull(),
      },
      order: {
        startTime: 'ASC',
        endTime: 'ASC',
      },
    });

    const minute = 60000;

    if (!todos) {
      await this.cacheManager.set(cacheKey, CACHE_EMPTY_SYMBOL, 1 * minute);
      return null;
    }

    await this.cacheManager.set(cacheKey, todos, 1 * minute);

    const todosMap = todos.reduce((map, todo) => {
      if (!map[String(todo.date)]) {
        map[String(todo.date)] = [];
      }
      map[String(todo.date)].push(todo);
      return map;
    }, {});

    return todosMap;
  }

  async createTodo(
    url: string,
    dto: CreateTodoDTO,
    UserId: number,
  ) {
    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const isMember = await this.rolesService.requireMember(UserId, space.id);

    if (!isMember) {
      throw new ForbiddenException({
        message: ACCESS_DENIED_MESSAGE,
        metaData: { spaceUrl: space.url },
      });
    }

    const targetTodo = await this.todosRepository.save({
      ...dto,
      AuthorId: UserId,
      SharedspaceId: space.id,
    });

    await this.invalidateTodosCache(space.url, targetTodo.date);
  }

  async updateTodo(
    url: string,
    dto: UpdateTodoDto,
    UserId: number,
  ) {
    const { id: todoId, ...rest } = dto;

    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const isMember = await this.rolesService.requireMember(UserId, space.id);

    if (!isMember) {
      throw new ForbiddenException({
        message: ACCESS_DENIED_MESSAGE,
        metaData: { spaceUrl: space.url },
      });
    }

    const targetTodo = await this.todosRepository.findOneBy({ id: todoId });

    if (targetTodo?.SharedspaceId !== space.id) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    await this.todosRepository.update({ id: todoId }, {
      ...rest,
      EditorId: UserId,
    });

    await this.invalidateTodosCache(space.url, targetTodo.date);
  }

  async deleteTodo(
    url: string,
    todoId: number,
    UserId: number,
  ) {
    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const isMember = await this.rolesService.requireMember(UserId, space.id);

    if (!isMember) {
      throw new ForbiddenException({
        message: ACCESS_DENIED_MESSAGE,
        metaData: { spaceUrl: space.url },
      });
    }

    const targetTodo = await this.todosRepository.findOneBy({ id: todoId });

    if (targetTodo?.SharedspaceId !== space.id) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const now = dayjs().toDate();

    await this.todosRepository.update({ id: todoId }, { removedAt: now });

    await this.invalidateTodosCache(space.url, targetTodo.date);
  }

  async searchTodos(
    url: string,
    query: string,
    page: number,
    UserId?: number,
    limit = 10,
  ) {
    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    if (space.private) {
      const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

      if (!isParticipant) {
        throw new ForbiddenException({
          message: ACCESS_DENIED_MESSAGE,
          metaData: { spaceUrl: space.url },
        });
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
  }

  async invalidateTodosCache(url: string, date: Date) {
    const targetDate = dayjs(date);
    const [ year, month ] = [ targetDate.year(), `${targetDate.month() + 1}`.padStart(2, '0') ];

    await this.cacheManager.del(`todos:${url}:${year}-${month}`);
  }
}