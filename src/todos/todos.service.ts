import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import dayjs from "dayjs";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, IsNull, LessThan, Like, Repository } from "typeorm";
import { Todos } from "src/entities/Todos";
import { CreateTodoDTO } from "./dto/create.todo.dto";
import { UpdateTodoDto } from "./dto/update.todo.dto";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE } from "src/common/constant/error.message";
import { RolesService } from "src/roles/roles.service";
import { CACHE_EMPTY_SYMBOL } from "src/common/constant/constants";
import { uuidv7 } from "uuidv7";
import { SharedspaceFetcher } from "src/sharedspaces/sharedspaces.fetcher";
import { RedisClientService } from "src/redisClient/redisClient.service";

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todos)
    private todosRepository: Repository<Todos>,
    private rolesService: RolesService,
    private redisClientService: RedisClientService,
    private sharedspaceFetcher: SharedspaceFetcher,
  ) {}

  async getTodosByMonth(
    SharedspaceId: string,
    date: string,
    UserId?: string,
  ) {
    const [ year, month ] = date.split('-');
    const startDate = dayjs(`${year}-${month}-01`).toDate();
    const endDate = dayjs(`${year}-${month}-31`).toDate();

    const space = await this.sharedspaceFetcher.getSharedspaceById(SharedspaceId);

    if (space.private) {
      const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

      if (!isParticipant) {
        throw new ForbiddenException({
          message: ACCESS_DENIED_MESSAGE,
          metaData: { SharedspaceId: space.id },
        });
      }
    }

    const cacheKey = `todos:${space.id}:${year}-${month}`;

    try {
      const cachedItem = await this.redisClientService.get<Map<string, Todos> | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

      if (cachedItem) {
        if (cachedItem === CACHE_EMPTY_SYMBOL) {
          return null;
        }

        return cachedItem;
      }
    } catch (err) {
      console.error(`Redis 키 조회 실패 : ${cacheKey}`, err);
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
    
    const todosMap = todos.reduce((map, todo) => {
      if (!map[String(todo.date)]) {
        map[String(todo.date)] = [];
      }
      map[String(todo.date)].push(todo);
      return map;
    }, {});

    const minute = 60000;

    try {
      if (!todos) {
        await this.redisClientService.set(cacheKey, CACHE_EMPTY_SYMBOL, 1 * minute);
        return null;
      }

      await this.redisClientService.set(cacheKey, todosMap, 1 * minute);
    } catch (err) {
      console.error(`Redis 키 저장 실패 : ${cacheKey}`, err);
    }

    return todosMap;
  }

  async createTodo(
    SharedspaceId: string,
    dto: CreateTodoDTO,
    UserId: string,
  ) {
    const isMember = await this.rolesService.requireMember(UserId, SharedspaceId);

    if (!isMember) {
      throw new ForbiddenException({
        message: ACCESS_DENIED_MESSAGE,
        metaData: { SharedspaceId },
      });
    }

    await this.todosRepository.insert({
      ...dto,
      id: uuidv7(),
      AuthorId: UserId,
      SharedspaceId,
    });

    await this.invalidateTodosCache(SharedspaceId, dto.date);
  }

  async updateTodo(
    SharedspaceId: string,
    dto: UpdateTodoDto,
    UserId: string,
  ) {
    const { id: todoId, ...rest } = dto;

    const isMember = await this.rolesService.requireMember(UserId, SharedspaceId);

    if (!isMember) {
      throw new ForbiddenException({
        message: ACCESS_DENIED_MESSAGE,
        metaData: { SharedspaceId },
      });
    }

    const result = await this.todosRepository.update({ id: todoId }, {
      ...rest,
      EditorId: UserId,
    });

    if (!result.affected) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    await this.invalidateTodosCache(SharedspaceId, dto.date);
  }

  async deleteTodo(
    SharedspaceId: string,
    todoId: string,
    UserId: string,
  ) {
    const isMember = await this.rolesService.requireMember(UserId, SharedspaceId);

    if (!isMember) {
      throw new ForbiddenException({
        message: ACCESS_DENIED_MESSAGE,
        metaData: { SharedspaceId },
      });
    }

    const targetTodo = await this.todosRepository.findOneBy({ id: todoId });

    if (targetTodo?.SharedspaceId !== SharedspaceId) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const now = dayjs().toDate();

    await this.todosRepository.update({ id: todoId }, { removedAt: now });

    await this.invalidateTodosCache(SharedspaceId, targetTodo.date);
  }

  async searchTodos(
    SharedspaceId: string,
    query: string,
    beforeTodoId: string,
    UserId?: string,
    limit = 10,
  ) {
    const space = await this.sharedspaceFetcher.getSharedspaceById(SharedspaceId);

    if (space.private) {
      const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

      if (!isParticipant) {
        throw new ForbiddenException({
          message: ACCESS_DENIED_MESSAGE,
          metaData: { SharedspaceId: space.id },
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
        SharedspaceId: space.id,
        id: LessThan(beforeTodoId),
        description: Like(`%${query}%`),
        removedAt: IsNull(),
      } : {
        SharedspaceId: space.id,
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

  async invalidateTodosCache(id: string, date: Date | string) {
    if (!id || !date) return;
    
    const [ year, month ] = dayjs(date).format('YYYY-MM').split('-');

    await this.redisClientService.del(`todos:${id}:${year}-${month}`);
  }
}