import { ConflictException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CreateSharedspaceDTO } from "./dto/create.sharedspace.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { nanoid } from "nanoid";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { DeleteSharedspaceDTO } from "./dto/delete.sharedspace.dto";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { ESharedspaceMembersRoles } from "src/typings/types";
import { Users } from "src/entities/Users";
import { ACCESS_DENIED_MESSAGE, NOT_FOUND_SPACE_MESSAGE } from "src/common/constant/error.message";
import { TodosService } from "src/todos/todos.service";
import { Todos } from "src/entities/Todos";

@Injectable()
export class SharedspacesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembersRepository: Repository<SharedspaceMembers>,
    private todosService: TodosService,
  ) {}

  async getSubscribedspaces(user: Users) { // TODO: filter query 추가
    const { id: UserId } = user;

    try {
      return await this.sharedspaceMembersRepository.find({
        select: {
          UserId: true,
          SharedspaceId: true,
          role: true,
          createdAt: true,
          Sharedspace: {
            name: true,
            url: true,
            private: true,
            Owner: {
              email: true,
            },
          },
        },
        relations: {
          Sharedspace: {
            Owner: true,
          },
        },
        where: {
          UserId,
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }
  }

  async getTodosForSpace(
    url: string,
    date: string,
    user: Users,
  ) {
    try {
      const { id: SharedspaceId } = await this.getSpacePermission(url, user);
      const todos = await this.todosService.getTodos(SharedspaceId, date);

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

  async createSharedspace(dto: CreateSharedspaceDTO) {
    const { OwnerId } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const created = await qr.manager.save(Sharedspaces, {
        url: nanoid(5),
        ...dto,
      });
      
      await qr.manager.save(SharedspaceMembers, {
        UserId: OwnerId,
        SharedspaceId: created.id,
        role: ESharedspaceMembersRoles.OWNER,
      });

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    } finally {
      await qr.release();
    }

    return true;
  }

  async updateSharedspaceName(dto: UpdateSharedspaceNameDTO) {
    const { name, SharedspaceId } = dto;
    
    try {
      const origin = await this.sharedspacesRepository.findOneBy({ id: SharedspaceId });

      if (origin.name === name) {
        throw new ConflictException('동일한 이름으로 바꿀수 없습니다.');
      }

      await this.sharedspacesRepository.update({ id: SharedspaceId }, { name });
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }

    return true;
  }

  async updateSharedspaceOwner(dto: UpdateSharedspaceOwnerDTO) {
    const { OwnerId, newOwnerId, SharedspaceId } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const origin = await this.sharedspacesRepository.findOneBy({ id: SharedspaceId });

      if (origin.OwnerId === newOwnerId) {
        throw new ConflictException('동일한 유저로 바꿀수 없습니다.');
      }

      await qr.manager.update(Sharedspaces, { id: SharedspaceId }, { OwnerId: newOwnerId });
      await qr.manager.update(SharedspaceMembers, { UserId: OwnerId, SharedspaceId }, { role: ESharedspaceMembersRoles.MEMBER });
      await qr.manager.save(SharedspaceMembers, { UserId: newOwnerId, SharedspaceId, role: ESharedspaceMembersRoles.OWNER });

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    } finally {
      await qr.release();
    }

    return true;
  }

  async deleteSharedspace(dto: DeleteSharedspaceDTO) {
    const { SharedspaceId } = dto;

    try {
      await this.sharedspacesRepository.delete({ id: SharedspaceId });
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }

    return true;
  }

  async getSpacePermission(
    identifier: string | number,
    user: Users,
  ) {
    try {
      const condition = {};

      if (typeof identifier === 'string') {
        Object.assign(condition, { url: identifier });
      }
  
      if (typeof identifier === 'number') {
        Object.assign(condition, { id: identifier });
      }
  
      const space = await this.sharedspacesRepository.findOne({
        select: {
          id: true,
          private: true,
        },
        where: condition,
      });
  
      const target = user?.Sharedspacemembers?.find(ele => ele?.SharedspaceId === space?.id);
  
      if (!space) {
        throw new NotFoundException(NOT_FOUND_SPACE_MESSAGE);
      }
  
      if (space.private) {
        if (!user || !target) {
          throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
        }
      }
  
      return space;
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }
  }

  async searchTodos(
    url: string,
    query: string,
    offset: number,
    limit: number,
    user: Users,
  ) {
    try {
      const { id: SharedspaceId } = await this.getSpacePermission(url, user);

      return await this.todosService.getTodosByQuery(
        SharedspaceId,
        query,
        offset,
        limit,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }
  }
}