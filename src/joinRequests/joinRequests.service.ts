import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { Users } from "src/entities/Users";
import { CreateJoinRequestDTO } from "./dto/create.joinRequest.dto";
import { DataSource, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JoinRequests } from "src/entities/JoinRequests";
import handleError from "src/common/function/handleError";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CONFLICT_MESSAGE } from "src/common/constant/error.message";
import { Roles } from "src/entities/Roles";
import { ResolveJoinRequestDTO } from "./dto/resolveJoinRequest.dto";
import { SharedspaceMembersRoles } from "src/typings/types";

@Injectable()
export class JoinRequestsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(JoinRequests)
    private joinRequestsRepository: Repository<JoinRequests>,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembersRepository: Repository<SharedspaceMembers>,
    @InjectRepository(Roles)
    private rolesRepository: Repository<Roles>,
  ) {}

  async getJoinRequest(
    targetSpace: Sharedspaces,
  ) {
    try {
      const requests = await this.joinRequestsRepository.find({
        select: {
          id: true,
          RequestorId: true,
          createdAt: true,
          message: true,
          Requestor: {
            email: true,
          },
        },
        relations: {
          Requestor: true,
        },
        where: {
          SharedspaceId: targetSpace.id,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return requests;
    } catch (err) {
      handleError(err);
    }
  }

  async resolveJoinRequest(
    targetSpace: Sharedspaces,
    targetJoinRequest: JoinRequests,
    dto: ResolveJoinRequestDTO,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      if (targetSpace.id !== targetJoinRequest.SharedspaceId) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      if (dto.RoleName === SharedspaceMembersRoles.OWNER) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      const role = await this.rolesRepository.findOneBy({ name: dto.RoleName });

      await qr.manager.save(SharedspaceMembers, {
        UserId: targetJoinRequest.RequestorId,
        SharedspaceId: targetJoinRequest.SharedspaceId,
        RoleId: role.id,
      });
      await qr.manager.delete(JoinRequests, { id: targetJoinRequest.id });
      
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      handleError(err);
    } finally {
      await qr.release();
    }

    return true;
  }
  
  async createJoinRequest(
    targetSpace: Sharedspaces,
    dto: CreateJoinRequestDTO,
    user: Users,
  ) {
    try {
      const isMember = await this.sharedspaceMembersRepository.findOneBy({ UserId: user.id, SharedspaceId: targetSpace.id });

      if (isMember?.Role.name === dto.RoleName) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      const isRequested = await this.joinRequestsRepository.findOneBy({ RequestorId: user.id, SharedspaceId: targetSpace.id });

      if (isRequested) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      await this.joinRequestsRepository.save({
        SharedspaceId: targetSpace.id,
        RequestorId: user.id,
        message: dto.message,
      });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async deleteJoinRequest(
    targetSpace: Sharedspaces,
    targetJoinRequest: JoinRequests
  ) {
    try {
      if (targetSpace.id !== targetJoinRequest.SharedspaceId) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      await this.joinRequestsRepository.delete({ id: targetJoinRequest.id });
    } catch (err) {
      handleError(err);
    }

    return true;
  }
}