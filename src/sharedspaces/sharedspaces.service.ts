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
import { ACCESS_DENIED_MESSAGE, NOT_FOUND_SPACE_MESSAGE } from "src/common/constant/errorMessages";
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

  async getSharedspaces(user: Users) {
    const { id: UserId } = user;

    try {
      return await this.sharedspaceMembersRepository.find({
        relations: {
          Sharedspace: true,
        },
        where: {
          UserId,
        }
      });
    } catch (err) {
      console.error(`getSharedspaces : ${err}`);
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

      return await this.todosService.getTodos(SharedspaceId, date);
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
      console.error(`createSharedspace : ${err}`);

      await qr.rollbackTransaction();

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
      console.error(`updateSharedspaceName : ${err}`);
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
      console.error(`updateSharedspaceOwner : ${err}`);

      await qr.rollbackTransaction();

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
      console.error(`deleteSharedspace : ${err}`);
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
  };
}