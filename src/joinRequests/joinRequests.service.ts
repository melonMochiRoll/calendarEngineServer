import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { CreateJoinRequestDTO } from "./dto/create.joinRequest.dto";
import { DataSource, IsNull, LessThan, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JoinRequests } from "src/entities/JoinRequests";
import { SpaceMembers } from "src/entities/SpaceMembers";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CONFLICT_REQUEST_MESSAGE } from "src/common/constant/error.message";
import { ResolveJoinRequestDTO } from "./dto/resolve.joinRequest.dto";
import { RolesService } from "src/roles/roles.service";
import { JOINREQUEST_STATUS, SHAREDSPACE_ROLE } from "src/common/constant/constants";
import { uuidv7 } from "uuidv7";
import { SharedspaceFetcher } from "src/sharedspaces/sharedspaces.fetcher";

@Injectable()
export class JoinRequestsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(JoinRequests)
    private joinRequestsRepository: Repository<JoinRequests>,
    private rolesService: RolesService,
    private sharedspaceFetcher: SharedspaceFetcher,
  ) {}

  async getJoinRequests(
    SharedspaceId: string,
    beforeJoinRequestId: string,
    UserId: string,
    limit = 10,
  ) {
    const isOwner = await this.rolesService.requireOwner(UserId, SharedspaceId);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const joinRequestRecords = await this.joinRequestsRepository.find({
      select: {
        id: true,
        RequestorId: true,
        createdAt: true,
        message: true,
        Requestor: {
          email: true,
          ProfileImage: {
            id: true,
            path: true,
          },
        },
      },
      relations: {
        Requestor: {
          ProfileImage: true,
        },
      },
      where: beforeJoinRequestId ? {
        SharedspaceId,
        id: LessThan(beforeJoinRequestId),
        removedAt: IsNull(),
      } : {
        SharedspaceId,
        removedAt: IsNull(),
      },
      order: {
        id: 'DESC',
      },
      take: limit + 1,
    });

    const hasMoreData = joinRequestRecords.length > limit;

    if (hasMoreData) {
      joinRequestRecords.pop();
    }   

    const joinRequests = joinRequestRecords.map(request => {
      return {
        ...request,
        Requestor: {
          ...request.Requestor,
          ProfileImage: request.Requestor.ProfileImage?.path,
        },
      };
    });

    return {
      joinRequests,
      hasMoreData,
    };
  }

  async resolveJoinRequest(
    SharedspaceId: string,
    joinRequestId: string,
    dto: ResolveJoinRequestDTO,
    UserId: string,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const isOwner = await this.rolesService.requireOwner(UserId, SharedspaceId);

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

      if (SharedspaceId !== targetJoinRequest?.SharedspaceId) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const roleInfo = await this.rolesService.getRoleInfo(dto.RoleName);

      if (roleInfo.name === SHAREDSPACE_ROLE.OWNER) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      await qr.manager.insert(SpaceMembers, {
        id: uuidv7(),
        UserId: targetJoinRequest.RequestorId,
        SharedspaceId,
        RoleId: roleInfo.id,
      });
      await qr.manager.update(JoinRequests, { id: targetJoinRequest.id }, { status: JOINREQUEST_STATUS.ACCEPTED });
      
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }
  
  async createJoinRequest(
    SharedspaceId: string,
    dto: CreateJoinRequestDTO,
    UserId: string,
  ) {
    const isParticipant = await this.rolesService.requireParticipant(UserId, SharedspaceId);

    if (isParticipant) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const isRequested = await this.joinRequestsRepository.findOneBy({ RequestorId: UserId, SharedspaceId, });

    if (isRequested) {
      throw new ConflictException(CONFLICT_REQUEST_MESSAGE);
    }

    await this.joinRequestsRepository.insert({
      id: uuidv7(),
      SharedspaceId,
      RequestorId: UserId,
      message: dto.message,
      status: JOINREQUEST_STATUS.PENDING,
    });
  }

  async rejectJoinRequest(
    SharedspaceId: string,
    joinRequestId: string,
    UserId: string,
  ) {
    const isOwner = await this.rolesService.requireOwner(UserId, SharedspaceId);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const result = await this.joinRequestsRepository.update(
      { id: joinRequestId },
      { status: JOINREQUEST_STATUS.REJECTED }
    );

    if (!result.affected) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }
  }
}