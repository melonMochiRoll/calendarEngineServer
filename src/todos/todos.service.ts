import { BadRequestException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, IsNull, LessThan, Like, Repository } from "typeorm";
import { Todos } from "src/entities/Todos";
import { CreateTodoDTO } from "./dto/create.todo.dto";
import { UpdateTodoDto } from "./dto/update.todo.dto";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE } from "src/common/constant/error.message";
import { RolesService } from "src/roles/roles.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { CACHE_EMPTY_SYMBOL } from "src/common/constant/constants";
import { uuidv7 } from "uuidv7";
import { SharedspaceFetcher } from "src/sharedspaces/sharedspaces.fetcher";

@Injectable()
export class TodosService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(Todos)
    private todosRepository: Repository<Todos>,
    private rolesService: RolesService,
    private sharedspaceFetcher: SharedspaceFetcher,
  ) {}

  async getTodosByMonth(
    url: string,
    date: string,
    UserId?: string,
  ) {
    const [ year, month ] = date.split('-');
    const startDate = dayjs(`${year}-${month}-01`).toDate();
    const endDate = dayjs(`${year}-${month}-31`).toDate();

    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

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

    const cachedItem = await this.cacheManager.get<Map<string, Todos> | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (cachedItem) {
      if (cachedItem === CACHE_EMPTY_SYMBOL) {
        return null;
      }

      return cachedItem;
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
        SpaceId: space.id,
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

    const todosMap = todos.reduce((map, todo) => {
      if (!map[String(todo.date)]) {
        map[String(todo.date)] = [];
      }
      map[String(todo.date)].push(todo);
      return map;
    }, {});

    await this.cacheManager.set(cacheKey, todosMap, 1 * minute);

    return todosMap;
  }

  async createTodo(
    url: string,
    dto: CreateTodoDTO,
    UserId: string,
  ) {
    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

    const isMember = await this.rolesService.requireMember(UserId, space.id);

    if (!isMember) {
      throw new ForbiddenException({
        message: ACCESS_DENIED_MESSAGE,
        metaData: { spaceUrl: space.url },
      });
    }

    await this.todosRepository.insert({
      ...dto,
      id: uuidv7(),
      AuthorId: UserId,
      SpaceId: space.id,
    });

    await this.invalidateTodosCache(space.url, dto.date);
  }

  async updateTodo(
    url: string,
    dto: UpdateTodoDto,
    UserId: string,
  ) {
    const { id: todoId, ...rest } = dto;

    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

    const isMember = await this.rolesService.requireMember(UserId, space.id);

    if (!isMember) {
      throw new ForbiddenException({
        message: ACCESS_DENIED_MESSAGE,
        metaData: { spaceUrl: space.url },
      });
    }

    const result = await this.todosRepository.update({ id: todoId }, {
      ...rest,
      EditorId: UserId,
    });

    if (!result.affected) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    await this.invalidateTodosCache(space.url, dto.date);
  }

  async deleteTodo(
    url: string,
    todoId: string,
    UserId: string,
  ) {
    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

    const isMember = await this.rolesService.requireMember(UserId, space.id);

    if (!isMember) {
      throw new ForbiddenException({
        message: ACCESS_DENIED_MESSAGE,
        metaData: { spaceUrl: space.url },
      });
    }

    const targetTodo = await this.todosRepository.findOneBy({ id: todoId });

    if (targetTodo?.SpaceId !== space.id) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const now = dayjs().toDate();

    await this.todosRepository.update({ id: todoId }, { removedAt: now });

    await this.invalidateTodosCache(space.url, targetTodo.date);
  }

  async searchTodos(
    url: string,
    query: string,
    beforeTodoId: string,
    UserId?: string,
    limit = 10,
  ) {
    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

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
      where: beforeTodoId ? {
        SpaceId: space.id,
        id: LessThan(beforeTodoId),
        description: Like(`%${query}%`),
        removedAt: IsNull(),
      } : {
        SpaceId: space.id,
        description: Like(`%${query}%`),
        removedAt: IsNull(),
      },
      order: {
        id: 'DESC',
      },
      take: limit + 1,
    });

    const hasMoreData = todoRecords.length > limit;

    if (hasMoreData) {
      todoRecords.pop();
    }

    return {
      todos: todoRecords,
      hasMoreData,
    };
  }

  async invalidateTodosCache(url: string, date: Date | string) {
    if (!url || !date) return;
    
    const [ year, month ] = dayjs(date).format('YYYY-MM').split('-');

    await this.cacheManager.del(`todos:${url}:${year}-${month}`);
  }
}