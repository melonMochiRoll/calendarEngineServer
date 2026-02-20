import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Invites } from "src/entities/Invites";
import { DataSource, MoreThan, Repository } from "typeorm";
import dayjs from "dayjs";
import { INVITE_STATUS } from "src/common/constant/constants";
import { SendInviteDTO } from "./dto/send.invite.dto";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CONFLICT_REQUEST_MESSAGE, CONFLICT_USER_MESSAGE } from "src/common/constant/error.message";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { RolesService } from "src/roles/roles.service";
import { UsersService } from "src/users/users.service";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { SharedspaceMembersRoles } from "src/typings/types";
import { AcceptInviteDTO } from "./dto/accept.invite.dto";
import { DeclineInviteDTO } from "./dto/decline.invite.dto";

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
    UserId: number,
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
        url: Sharedspace.url,
        OwnerEmail: Sharedspace.Owner.email,
      };
    });

    return {
      invites,
      hasMoredata: !Boolean(page * limit >= totalCount),
    };
  }

  async sendInvite(
    dto: SendInviteDTO,
    UserId: number,
  ) {
    const { url, inviteeEmail } = dto;

    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const isMember = await this.rolesService.requireMember(UserId, space.id);
    
    if (!isMember) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const invitee = await this.usersService.getUserByEmail(inviteeEmail);

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
        status: INVITE_STATUS.PENDING,
        expiredAt: MoreThan(dayjs().toDate()),
      },
    });

    if (isSent) {
      throw new ConflictException(CONFLICT_REQUEST_MESSAGE);
    }

    await this.invitesRepository.save({
      SharedspaceId: space.id,
      InviterId: UserId,
      InviteeId: invitee.id,
      expiredAt: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
    });
  }

  async acceptInvite(
    dto: AcceptInviteDTO,
    UserId: number,
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

      const targetInvite = await this.invitesRepository.findOne({
        select: {
          id: true,
        },
        where: {
          id: targetInviteId,
          InviteeId: UserId,
          status: INVITE_STATUS.PENDING,
          expiredAt: MoreThan(dayjs().toDate()),
        },
      });

      if (!targetInvite) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      await qr.manager.update(Invites,
        {
          id: targetInvite.id,
        },
        {
          status: INVITE_STATUS.ACCEPTED,
        },
      );

      const rolesArray = await this.rolesService.getRolesArray();
      const role = rolesArray.find(role => role.name === SharedspaceMembersRoles.VIEWER);

      await qr.manager.save(SharedspaceMembers,
        {
          UserId,
          SharedspaceId: space.id,
          RoleId: role.id,
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
    UserId: number,
  ) {
    const { id: targetInviteId } = dto;

    const targetInvite = await this.invitesRepository.findOne({
      select: {
        id: true,
      },
      where: {
        id: targetInviteId,
        InviteeId: UserId,
        status: INVITE_STATUS.PENDING,
        expiredAt: MoreThan(dayjs().toDate()),
      },
    });

    if (!targetInvite) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    await this.invitesRepository.update(
      {
        id: targetInvite.id,
      },
      {
        status: INVITE_STATUS.REJECTED,
      }
    );
  }

  async cancelInvite(
    targetInviteId: number,
    url: string,
    UserId: number,
  ) {
    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const isMember = await this.rolesService.requireMember(UserId, space.id);
    
    if (!isMember) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const targetInvite = await this.invitesRepository.findOne({
      select: {
        id: true,
      },
      where: {
        id: targetInviteId,
        InviterId: UserId,
        status: INVITE_STATUS.PENDING,
        expiredAt: MoreThan(dayjs().toDate()),
      },
    });

    if (!targetInvite) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    await this.invitesRepository.delete({ id: targetInvite.id });
  }
}