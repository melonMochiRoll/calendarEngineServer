import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { CreateJoinRequestDTO } from "./dto/create.joinRequest.dto";
import { DataSource, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JoinRequests } from "src/entities/JoinRequests";
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
    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
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

      const isOwner = await this.rolesService.requireOwner(UserId, space.id);

      if (!isOwner) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
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

      throw err;
    } finally {
      await qr.release();
    }
  }
  
  async createJoinRequest(
    url: string,
    dto: CreateJoinRequestDTO,
    UserId: number,
  ) {
    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

    if (isParticipant) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const isRequested = await this.joinRequestsRepository.findOneBy({ RequestorId: UserId, SharedspaceId: space.id });

    if (isRequested) {
      throw new ConflictException(CONFLICT_REQUEST_MESSAGE);
    }

    await this.joinRequestsRepository.save({
      SharedspaceId: space.id,
      RequestorId: UserId,
      message: dto.message,
    });
  }

  async deleteJoinRequest(
    url: string,
    joinRequestId: number,
    UserId: number,
  ) {
    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
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

    await this.joinRequestsRepository.delete({ id: targetJoinRequest.id });
  }
}