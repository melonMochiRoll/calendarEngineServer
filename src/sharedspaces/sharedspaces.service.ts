import { ConflictException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CreateSharedspaceDTO } from "./dto/create.sharedspace.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Equal, Or, Repository } from "typeorm";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { nanoid } from "nanoid";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { SharedspaceMembersRoles, SubscribedspacesFilter, TSubscribedspacesFilter } from "src/typings/types";
import { Users } from "src/entities/Users";
import { ACCESS_DENIED_MESSAGE, NOT_FOUND_SPACE_MESSAGE } from "src/common/constant/error.message";
import { TodosService } from "src/todos/todos.service";

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

  async getSharedspace(url: string) {
    try {
      return await this.sharedspacesRepository.findOne({
        select: {
          id: true,
          name: true,
          url: true,
          private: true,
          Owner: {
            email: true,
          },
          Sharedspacemembers: {
            UserId: true,
            role: true,
            createdAt: true,
            User: {
              email: true,
            }
          },
        },
        relations: {
          Owner: true,
          Sharedspacemembers: {
            User: true,
          },
        },
        where: {
          url,
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }
  }

  async getSubscribedspaces(
    filter: TSubscribedspacesFilter,
    user: Users,
  ) {
    const whereCondition = {
      UserId: user.id,
    };

    if (filter === SubscribedspacesFilter.OWNED) {
      Object.assign(whereCondition, { role: SharedspaceMembersRoles.OWNER });
    }

    if (filter === SubscribedspacesFilter.UNOWNED) {
      const result =
        Object
          .values(SharedspaceMembersRoles)
          .filter(role => role !== SharedspaceMembersRoles.OWNER)
          .map(role => Equal(role));

      Object.assign(whereCondition, { role: Or(...result) });
    }

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
        where: whereCondition,
        order: {
          createdAt: 'DESC',
        },
      });
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
        role: SharedspaceMembersRoles.OWNER,
      });

      await qr.commitTransaction();

      return created.url;
    } catch (err) {
      await qr.rollbackTransaction();

      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    } finally {
      await qr.release();
    }
  }

  async updateSharedspaceName(
    dto: UpdateSharedspaceNameDTO,
    url: string,
  ) {
    const { name } = dto;
    
    try {
      const origin = await this.sharedspacesRepository.findOneBy({ url });

      if (origin.name === name) {
        throw new ConflictException('동일한 이름으로 바꿀수 없습니다.');
      }

      await this.sharedspacesRepository.update({ url }, { name });
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }

    return true;
  }

  async updateSharedspaceOwner(
    dto: UpdateSharedspaceOwnerDTO,
    url: string,
  ) {
    const { OwnerId, newOwnerId } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const origin = await this.sharedspacesRepository.findOneBy({ url });

      if (origin.OwnerId === newOwnerId) {
        throw new ConflictException('동일한 유저로 바꿀수 없습니다.');
      }

      await qr.manager.update(Sharedspaces, { id: origin.id }, { OwnerId: newOwnerId });
      await qr.manager.update(SharedspaceMembers, { UserId: OwnerId, SharedspaceId: origin.id }, { role: SharedspaceMembersRoles.MEMBER });
      await qr.manager.save(SharedspaceMembers, { UserId: newOwnerId, SharedspaceId: origin.id, role: SharedspaceMembersRoles.OWNER });

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

  async deleteSharedspace(url: string) {
    try {
      await this.sharedspacesRepository.delete({ url });
    } catch (err) {
      if (err instanceof HttpException) {
        throw new HttpException(err.getResponse(), err.getStatus());
      }
      throw new InternalServerErrorException(err);
    }

    return true;
  }

  async DEPRECATED_getSpacePermission(
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
}