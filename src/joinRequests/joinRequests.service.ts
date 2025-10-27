import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { Users } from "src/entities/Users";
import { CreateJoinRequestDTO } from "./dto/create.joinRequest.dto";
import { DataSource, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JoinRequests } from "src/entities/JoinRequests";
import handleError from "src/common/function/handleError";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CONFLICT_REQUEST_MESSAGE } from "src/common/constant/error.message";
import { Roles } from "src/entities/Roles";
import { ResolveJoinRequestDTO } from "./dto/resolve.joinRequest.dto";
import { SharedspaceMembersRoles } from "src/typings/types";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { RolesService } from "src/roles/roles.service";

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
    private sharedspacesService: SharedspacesService,
    private rolesService: RolesService,
  ) {}

  async getJoinRequests(
    url: string,
    UserId: number,
  ) {
    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      if (space.private) {
        await this.rolesService.requireOwner(UserId, space.id);
      }

      const requests = await this.joinRequestsRepository.find({
        select: {
          id: true,
          RequestorId: true,
          createdAt: true,
          message: true,
          Requestor: {
            email: true,
            profileImage: true,
          },
        },
        relations: {
          Requestor: true,
        },
        where: {
          SharedspaceId: space.id,
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
    url: string,
    joinRequestId: number,
    dto: ResolveJoinRequestDTO,
    UserId: number,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      if (space.private) {
        await this.rolesService.requireOwner(UserId, space.id);
      }

      const targetJoinRequest = await this.joinRequestsRepository.findOne({
        select: {
          SharedspaceId: true,
        },
        where: {
          id: joinRequestId,
        },
      });

      if (space.id !== targetJoinRequest?.SharedspaceId) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const role = await this.rolesRepository.findOne({
        select: {
          id: true,
          name: true,
        },
        where: {
          name: dto.RoleName,
        },
      });

      if (role.name === SharedspaceMembersRoles.OWNER) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

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
      const isMember = await this.sharedspaceMembersRepository.findOne({
        select: {
          UserId: true,
          SharedspaceId: true,
          RoleId: true,
          Role: {
            id: true,
            name: true,
          },
        },
        relations: {
          Role: true,
        },
        where: { UserId: user.id, SharedspaceId: targetSpace.id },
      });

      const hasPermission = isMember.Role.name === SharedspaceMembersRoles.MEMBER || isMember.Role.name === SharedspaceMembersRoles.OWNER;

      if (hasPermission) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const isRequested = await this.joinRequestsRepository.findOneBy({ RequestorId: user.id, SharedspaceId: targetSpace.id });

      if (isRequested) {
        throw new ConflictException(CONFLICT_REQUEST_MESSAGE);
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