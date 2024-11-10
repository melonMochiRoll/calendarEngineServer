import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateSharedspaceDTO } from "./dto/create.sharedspace.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Equal, IsNull, Or, Repository } from "typeorm";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { nanoid } from "nanoid";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { SharedspaceMembersRoles, SubscribedspacesFilter, TSubscribedspacesFilter } from "src/typings/types";
import { Users } from "src/entities/Users";
import { BAD_REQUEST_MESSAGE, CONFLICT_MESSAGE, NOT_FOUND_RESOURCE } from "src/common/constant/error.message";
import { TodosService } from "src/todos/todos.service";
import { CreateSharedspaceMembersDTO } from "./dto/create.sharedspace.members.dto";
import { UpdateSharedspaceMembersDTO } from "./dto/update.sharedspace.members.dto";
import handleError from "src/common/function/handleError";
import { UpdateSharedspacePrivateDTO } from "./dto/update.sharedspace.private.dto";
import { Roles } from "src/entities/Roles";

@Injectable()
export class SharedspacesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembersRepository: Repository<SharedspaceMembers>,
    @InjectRepository(Roles)
    private rolesRepository: Repository<Roles>,
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
            id: true,
            email: true,
          },
          Sharedspacemembers: {
            UserId: true,
            RoleName: true,
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
          deletedAt: IsNull(),
          url,
        }
      });
    } catch (err) {
      handleError(err);
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
          RoleName: true,
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
      handleError(err);
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

      handleError(err);
    } finally {
      await qr.release();
    }
  }

  async updateSharedspaceName(
    url: string,
    dto: UpdateSharedspaceNameDTO,
  ) {
    const { name } = dto;
    
    try {
      const origin = await this.findActiveSpaceByUrl(url);

      if (origin.name === name) {
        throw new ConflictException('동일한 이름으로 바꿀수 없습니다.');
      }

      await this.sharedspacesRepository.update({ url }, { name });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async updateSharedspaceOwner(
    url: string,
    dto: UpdateSharedspaceOwnerDTO,
  ) {
    const { OwnerId, newOwnerId } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const origin = await this.findActiveSpaceByUrl(url);

      if (origin.OwnerId === newOwnerId) {
        throw new ConflictException('동일한 유저로 바꿀수 없습니다.');
      }

      await qr.manager.update(Sharedspaces, { id: origin.id }, { OwnerId: newOwnerId });
      await qr.manager.update(SharedspaceMembers, { UserId: OwnerId, SharedspaceId: origin.id }, { RoleName: SharedspaceMembersRoles.MEMBER });
      await qr.manager.save(SharedspaceMembers, { UserId: newOwnerId, SharedspaceId: origin.id, RoleName: SharedspaceMembersRoles.OWNER });

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      handleError(err);
    } finally {
      await qr.release();
    }

    return true;
  }

  async updateSharedspacePrivate(
    url: string,
    dto: UpdateSharedspacePrivateDTO,
  ) {
    try {
      await this.sharedspacesRepository.update({ url }, { ...dto });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async deleteSharedspace(url: string) {
    try {
      await this.sharedspacesRepository.softDelete({ url });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async createSharedspaceMembers(
    url: string,
    dto: CreateSharedspaceMembersDTO,
  ) {
    const { UserId, RoleName } = dto;

    try {
      const role = await this.rolesRepository.findOneBy({ name: RoleName });

      if (!role) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const targetSpace = await this.findActiveSpaceByUrl(url);

      const isMember = await this.sharedspaceMembersRepository.findOneBy({
        UserId,
        SharedspaceId: targetSpace?.id,
      });

      if (isMember) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      await this.sharedspaceMembersRepository.save({
        UserId,
        SharedspaceId: targetSpace?.id,
        RoleName: role.name,
      });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async updateSharedspaceMembers(
    url: string,
    dto: UpdateSharedspaceMembersDTO,
  ) {
    const { UserId, RoleName } = dto;

    try {
      if (RoleName === SharedspaceMembersRoles.OWNER) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      const role = await this.rolesRepository.findOneBy({ name: RoleName });

      if (!role) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const targetSpace = await this.findActiveSpaceByUrl(url);

      const isMember = await this.sharedspaceMembersRepository.findOneBy({
        UserId,
        SharedspaceId: targetSpace?.id,
      });

      if (!isMember) {
        throw new NotFoundException(NOT_FOUND_RESOURCE);
      }

      await this.sharedspaceMembersRepository.update({
        UserId,
        SharedspaceId: targetSpace?.id,
      },{
        RoleName: role.name,
      });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async deleteSharedspaceMembers(
    url: string,
    UserId: number,
  ) {
    try {
      const targetSpace = await this.findActiveSpaceByUrl(url);

      const isMember = await this.sharedspaceMembersRepository.findOneBy({
        UserId,
        SharedspaceId: targetSpace?.id,
      });

      if (!isMember) {
        throw new NotFoundException(NOT_FOUND_RESOURCE);
      }

      await this.sharedspaceMembersRepository.delete({
        UserId,
        SharedspaceId: targetSpace?.id,
      });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async findActiveSpaceByUrl(url: string) {
    try {
      const targetSpace = await this.sharedspacesRepository.findOneBy({ deletedAt: IsNull(), url });

      return targetSpace || null;
    } catch (err) {
      handleError(err);
    }
  };
}