import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Invites } from "src/entities/Invites";
import { DataSource, MoreThan, Repository } from "typeorm";
import dayjs from "dayjs";
import { INVITE_STATUS, SHAREDSPACE_ROLE } from "src/common/constant/constants";
import { SendInviteDTO } from "./dto/send.invite.dto";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CONFLICT_REQUEST_MESSAGE, CONFLICT_USER_MESSAGE, NOT_FOUND_USER } from "src/common/constant/error.message";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { RolesService } from "src/roles/roles.service";
import { UsersService } from "src/users/users.service";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { AcceptInviteDTO } from "./dto/accept.invite.dto";
import { DeclineInviteDTO } from "./dto/decline.invite.dto";
import { uuidv7 } from "uuidv7";

@Injectable()
export class InvitesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Invites)
    private invitesRepository: Repository<Invites>,
    private usersService: UsersService,
    private sharedspacesService: SharedspacesService,
    private rolesService: RolesService,
  ) {}

  async getInvites(
    UserId: string,
    page = 1,
    limit = 7,
  ) {
    const inviteRecords = await this.invitesRepository.find({
      select: {
        id: true,
        createdAt: true,
        Sharedspace: {
          name: true,
          url: true,
          Owner: {
            email: true,
            nickname: true,
            profileImage: true,
          },
        },
      },
      relations: {
        Sharedspace: {
          Owner: true,
        },
      },
      where: {
        InviteeId: UserId,
        status: INVITE_STATUS.PENDING,
        expiredAt: MoreThan(dayjs().toDate()),
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await this.invitesRepository.count({
      where: {
        InviteeId: UserId,
        status: INVITE_STATUS.PENDING,
        expiredAt: MoreThan(dayjs().toDate()),
      },
    });

    const invites = inviteRecords.map((invite) => {
      const { Sharedspace, ...rest } = invite;
      return {
        ...rest,
        SharedspaceName: Sharedspace.name,
        Owner: Sharedspace.Owner,
        url: Sharedspace.url,
      };
    });

    return {
      invites,
      hasMoredata: !Boolean(page * limit >= totalCount),
    };
  }

  async sendInvite(
    dto: SendInviteDTO,
    UserId: string,
  ) {
    const { url, inviteeEmail } = dto;

    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const isMember = await this.rolesService.requireMember(UserId, space.id);
    
    if (!isMember) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const invitee = await this.usersService.getUserByEmail(inviteeEmail);

    if (!invitee) {
      throw new BadRequestException(NOT_FOUND_USER);
    }

    const isParticipant = await this.rolesService.requireParticipant(invitee.id, space.id);

    if (isParticipant) {
      throw new ConflictException(CONFLICT_USER_MESSAGE);
    }

    const isSent = await this.invitesRepository.findOne({
      select: {
        id: true,
      },
      where: {
        SharedspaceId: space.id,
        InviteeId: invitee.id,
        status: INVITE_STATUS.PENDING,
        expiredAt: MoreThan(dayjs().toDate()),
      },
    });

    if (isSent) {
      throw new ConflictException(CONFLICT_REQUEST_MESSAGE);
    }

    await this.invitesRepository.insert({
      id: uuidv7(),
      SharedspaceId: space.id,
      InviterId: UserId,
      InviteeId: invitee.id,
      expiredAt: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
    });
  }

  async acceptInvite(
    dto: AcceptInviteDTO,
    UserId: string,
  ) {
    const { id: targetInviteId, url } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

      if (isParticipant) {
        throw new ConflictException(CONFLICT_USER_MESSAGE);
      }

      const result = await qr.manager.update(Invites,
        {
          id: targetInviteId,
          InviteeId: UserId,
          status: INVITE_STATUS.PENDING,
          expiredAt: MoreThan(dayjs().toDate()),
        },
        {
          status: INVITE_STATUS.ACCEPTED,
        },
      );

      if (!result.affected) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const viewerInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.VIEWER);

      await qr.manager.insert(SharedspaceMembers,
        {
          id: uuidv7(),
          UserId,
          SharedspaceId: space.id,
          RoleId: viewerInfo.id,
        }
      );

      await qr.commitTransaction();
      await this.rolesService.invalidateUserRoleCache(UserId, space.id);
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    } 
  }

  async declineInvite(
    dto: DeclineInviteDTO,
    UserId: string,
  ) {
    const { id: targetInviteId } = dto;

    const result = await this.invitesRepository.update(
      {
        id: targetInviteId,
        InviteeId: UserId,
        status: INVITE_STATUS.PENDING,
        expiredAt: MoreThan(dayjs().toDate()),
      },
      {
        status: INVITE_STATUS.REJECTED,
      }
    );

    if (!result.affected) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }
  }

  async cancelInvite(
    targetInviteId: string,
    url: string,
    UserId: string,
  ) {
    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const isMember = await this.rolesService.requireMember(UserId, space.id);
    
    if (!isMember) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const result = await this.invitesRepository.update(
      {
        id: targetInviteId,
        InviterId: UserId,
        status: INVITE_STATUS.PENDING,
        expiredAt: MoreThan(dayjs().toDate()),
      },
      { status: INVITE_STATUS.CANCELED }
    );

    if (!result.affected) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }
  }
}