import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { Friendships } from "src/entities/Friendships";
import { DataSource, LessThan, Repository } from "typeorm";
import { SendFriendshipDTO } from "./dto/send.friendship.dto";
import { CONFLICT_FRIENDSHIP_MESSAGE, NOT_FOUND_USER } from "src/common/constant/error.message";
import { UsersFetcher } from "src/users/users.fetcher";
import { InjectRepository } from "@nestjs/typeorm";
import { FRIENDSHIPS_STATUS, USER_STATUS } from "src/common/constant/constants";
import { AcceptFriendshipDTO } from "./dto/accept.friendship.dto";
import { RejectFriendshipDTO } from "./dto/reject.friendship.dto";

@Injectable()
export class FriendshipsService {
  constructor(
    private dataSource: DataSource,
    private usersFetcher: UsersFetcher,
    @InjectRepository(Friendships)
    private friendshipsRepository: Repository<Friendships>,
  ) {}

  async getFriendships(
    beforeFriendshipId: string,
    UserId: string,
    limit = 10,
  ) {
    const friendshipRecords = await this.friendshipsRepository.find({
      select: {
        id: true,
        status: true,
        RequesterId: true,
        Requester: {
          email: true,
          nickname: true,
          ProfileImage: {
            path: true,
          },
        },
      },
      where: beforeFriendshipId ? {
        id: LessThan(beforeFriendshipId),
        RequesteeId: UserId,
        status: FRIENDSHIPS_STATUS.ACCEPTED,
        Requester: {
          status: USER_STATUS.ACTIVE,
        },
      } : {
        RequesteeId: UserId,
        status: FRIENDSHIPS_STATUS.ACCEPTED,
        Requester: {
          status: USER_STATUS.ACTIVE,
        },
      },
      relations: {
        Requester: {
          ProfileImage: true,
        },
      },
      order: {
        id: 'DESC',
      },
      take: limit + 1,
    });

    const hasMoreData = friendshipRecords.length > limit;

    if (hasMoreData) {
      friendshipRecords.pop();
    }

    const friendships = friendshipRecords.map(friendship => {
      const { Requester, ...rest } = friendship;
      const { ProfileImage, ...requesterRest } = Requester;

      return {
        ...rest,
        ...requesterRest,
        ProfileImage: ProfileImage?.path,
      };
    });

    return {
      friendships,
      hasMoreData,
    };
  }

  async getFriendshipRequests(
    beforeFriendshipRequestId: string,
    UserId: string,
    limit = 10,
  ) {
    const friendshipRequestRecords = await this.friendshipsRepository.find({
      select: {
        id: true,
        status: true,
        RequesterId: true,
        Requester: {
          email: true,
          nickname: true,
          ProfileImage: {
            path: true,
          },
        },
      },
      where: beforeFriendshipRequestId ? {
        id: LessThan(beforeFriendshipRequestId),
        RequesteeId: UserId,
        status: FRIENDSHIPS_STATUS.PENDING,
        Requester: {
          status: USER_STATUS.ACTIVE,
        },
      } : {
        RequesteeId: UserId,
        status: FRIENDSHIPS_STATUS.PENDING,
        Requester: {
          status: USER_STATUS.ACTIVE,
        },
      },
      relations: {
        Requester: {
          ProfileImage: true,
        },
      },
      order: {
        id: 'DESC',
      },
      take: limit + 1,
    });

    const hasMoreData = friendshipRequestRecords.length > limit;

    if (hasMoreData) {
      friendshipRequestRecords.pop();
    }

    const friendshipRequests = friendshipRequestRecords.map(friendship => {
      const { Requester, ...rest } = friendship;
      const { ProfileImage, ...requesterRest } = Requester;

      return {
        ...rest,
        ...requesterRest,
        ProfileImage: ProfileImage?.path,
      };
    });

    return {
      friendshipRequests,
      hasMoreData,
    };
  }

  async sendFriendship(
    dto: SendFriendshipDTO,
    UserId: string,
  ) {
    const { RequesteeId } = dto;

    const Requestee = await this.usersFetcher.getUserById(RequesteeId);

    if (!Requestee) {
      throw new BadRequestException(NOT_FOUND_USER);
    }

    const isRequestOrFriendship = await this.friendshipsRepository.findOne({
      select: {
        id: true,
      },
      where: {
        RequesterId: UserId,
        RequesteeId: Requestee.id,
      },
    });

    if (isRequestOrFriendship) {
      throw new ConflictException(CONFLICT_FRIENDSHIP_MESSAGE);
    }

    await this.friendshipsRepository.insert({
      RequesterId: UserId,
      RequesteeId,
      status: FRIENDSHIPS_STATUS.PENDING,
    });
  }

  async acceptFriendship(
    dto: AcceptFriendshipDTO,
    UserId: string,
  ) {
    const { RequesterId } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const [ id1, id2 ] = [UserId, RequesterId].sort((a, b) => a.localeCompare(b));

      await qr.manager.upsert(Friendships,
        {
          RequesterId: id1,
          RequesteeId: id2,
          status: FRIENDSHIPS_STATUS.ACCEPTED,
        },
        ['RequesterId', 'RequesteeId'],
      );

      await qr.manager.upsert(Friendships,
        {
          RequesterId: id2,
          RequesteeId: id1,
          status: FRIENDSHIPS_STATUS.ACCEPTED,
        },
        ['RequesterId', 'RequesteeId'],
      );

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async rejectFriendship(
    dto: RejectFriendshipDTO,
    UserId: string,
  ) {
    const { RequesterId } = dto;

    await this.friendshipsRepository.delete([
      {
        RequesterId: UserId,
        RequesteeId: RequesterId,
        status: FRIENDSHIPS_STATUS.PENDING,
      },
      {
        RequesterId: RequesterId,
        RequesteeId: UserId,
        status: FRIENDSHIPS_STATUS.PENDING,
      }
    ]);
  }

  async deleteFriendship(
    RequesterId: string,
    UserId: string,
  ) {
    await this.friendshipsRepository.delete([
      {
        RequesterId: UserId,
        RequesteeId: RequesterId,
        status: FRIENDSHIPS_STATUS.ACCEPTED,
      },
      {
        RequesterId: RequesterId,
        RequesteeId: UserId,
        status: FRIENDSHIPS_STATUS.ACCEPTED,
      }
    ]);
  }
}