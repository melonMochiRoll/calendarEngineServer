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
import { Users } from "src/entities/Users";
import { getFullImageUrl, uuidToString } from "src/common/function/utilFunctions";
import { uuidv7 } from "uuidv7";

@Injectable()
export class FriendshipsService {
  constructor(
    private dataSource: DataSource,
    private usersFetcher: UsersFetcher,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
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
      id: uuidv7(),
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
          id: uuidv7(),
          RequesterId: id1,
          RequesteeId: id2,
          status: FRIENDSHIPS_STATUS.ACCEPTED,
        },
        ['RequesterId', 'RequesteeId'],
      );

      await qr.manager.upsert(Friendships,
        {
          id: uuidv7(),
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

  async searchUser(
    query: string,
    beforeUserId: string,
    UserId: string,
    limit = 10,
  ) {
    const qb1 = this.usersRepository
      .createQueryBuilder('users')
      .select([
        'users.id AS id',
        'users.email AS email',
        'users.nickname AS nickname',
      ])
      .leftJoin('users.ProfileImage', 'ProfileImage')
      .addSelect(['ProfileImage.path AS ProfileImage'])
      .leftJoin('users.SentFriendships', 'Friendship', 'Friendship.RequesteeId = :RequesteeId', { RequesteeId: UserId })
      .addSelect([
        'Friendship.RequesteeId AS RequesteeId',
        'Friendship.status AS Friendship_status',
      ])
      .where('users.email LIKE :email', { email: `${query}%` })
      .andWhere('users.status = :status1', { status1: USER_STATUS.ACTIVE });

    const qb2 = this.usersRepository
      .createQueryBuilder('users')
      .select([
        'users.id AS id',
        'users.email AS email',
        'users.nickname AS nickname',
      ])
      .leftJoin('users.ProfileImage', 'ProfileImage')
      .addSelect(['ProfileImage.path AS ProfileImage'])
      .leftJoin('users.SentFriendships', 'Friendship', 'Friendship.RequesteeId = :RequesteeId', { RequesteeId: UserId })
      .addSelect([
        'Friendship.RequesteeId AS RequesteeId',
        'Friendship.status AS Friendship_status',
      ])
      .where('users.nickname LIKE :nickname', { nickname: `${query}%` })
      .andWhere('users.status = :status2', { status2: USER_STATUS.ACTIVE });

    if (beforeUserId) {
      qb1.andWhere('users.id < :beforeUserId', { beforeUserId });
      qb2.andWhere('users.id < :beforeUserId', { beforeUserId });
    }

    const userRecords = await this.dataSource
      .createQueryBuilder()
      .select([
        'combined.id AS id',
        'combined.email AS email',
        'combined.nickname AS nickname',
        'combined.ProfileImage AS ProfileImage',
        'combined.Friendship_status AS Friendship_status',
      ])
      .from(`( (${qb1.getQuery()}) UNION (${qb2.getQuery()}) )`, 'combined')
      .setParameters({ ...qb1.getParameters(), ...qb2.getParameters() })
      .orderBy('combined.id', 'DESC')
      .limit(limit + 1)
      .getRawMany();

    const hasMoreData = userRecords.length > limit;

    if (hasMoreData) {
      userRecords.pop();
    }

    const users = userRecords.map((user) => {
      const { id, ProfileImage, Friendship_status, ...rest } = user;
      const transformedId = uuidToString(id);
      const url = getFullImageUrl(ProfileImage);

      return {
        ...rest,
        id: transformedId,
        ProfileImage: url,
        permission: {
          isFriendship: Friendship_status === FRIENDSHIPS_STATUS.ACCEPTED || transformedId === UserId,
        },
      };
    });

    return {
      users,
      hasMoreData,
    };
  }
}