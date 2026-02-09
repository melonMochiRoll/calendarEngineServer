import { ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import handleError from "src/common/function/handleError";
import { Invites } from "src/entities/Invites";
import { MoreThan, Repository } from "typeorm";
import dayjs from "dayjs";
import { INVITE_STATUS } from "src/common/constant/constants";
import { SendInviteDTO } from "./dto/send.invite.dto";
import { ACCESS_DENIED_MESSAGE, CONFLICT_REQUEST_MESSAGE, CONFLICT_USER_MESSAGE } from "src/common/constant/error.message";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { RolesService } from "src/roles/roles.service";
import { UsersService } from "src/users/users.service";

@Injectable()
export class InvitesService {
  constructor(
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
    try {
      const invites = await this.invitesRepository.find({
        select: {
          id: true,
          createdAt: true,
          Sharedspace: {
            name: true,
            url: true,
          },
        },
        relations: {
          Sharedspace: true,
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

      return {
        invites,
        hasMoredata: !Boolean(page * limit >= totalCount),
      };
    } catch (err) {
      handleError(err);
    }
  }

  async sendInvite(
    dto: SendInviteDTO,
    UserId: number,
  ) {
    const { url, inviteeEmail } = dto;

    try {
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

      return true;
    } catch (err) {
      handleError(err);
    }
  }
}