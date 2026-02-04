import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import handleError from "src/common/function/handleError";
import { Invites } from "src/entities/Invites";
import { MoreThan, Repository } from "typeorm";
import dayjs from "dayjs";
import { INVITE_STATUS } from "src/common/constant/constants";

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invites)
    private invitesRepository: Repository<Invites>,
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

      return invites;
    } catch (err) {
      handleError(err);
    }
  }
}