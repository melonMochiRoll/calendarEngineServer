import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { DataSource, In, Repository } from "typeorm";
import bcrypt from 'bcrypt';
import { CreateUserDTO } from "./dto/create.user.dto";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { CONFLICT_ACCOUNT_MESSAGE, CONFLICT_FRIENDSHIP_MESSAGE, CONFLICT_MESSAGE, NOT_FOUND_USER, PROFILE_IMAGE_TOO_LARGE_MESSAGE } from "src/common/constant/error.message";
import { SpaceMembers } from "src/entities/SpaceMembers";
import { RolesService } from "src/roles/roles.service";
import { FRIENDSHIPS_STATUS, IMAGE_STATUS, IMAGE_TYPE, JOB_NAMES, JOB_STATUS, SHAREDSPACE_ROLE, USER_PROVIDER, USER_STATUS } from "src/common/constant/constants";
import { RefreshTokens } from "src/entities/RefreshTokens";
import { JoinRequests } from "src/entities/JoinRequests";
import { Invites } from "src/entities/Invites";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { BatchScheduler } from "src/entities/BatchScheduler";
import dayjs from "dayjs";
import { uuidv7 } from "uuidv7";
import { uuidToString } from "src/common/function/utilFunctions";
import { ProfileImages } from "src/entities/ProfileImages";
import { Images } from "src/entities/Images";
import { GenerateProfileImagePresignedPutUrlDTO } from "./dto/generate.profileImage.presigned.put.url.dto";
import { StorageR2Service } from "src/storage/storage.r2.service";
import { UpdateProfileImageDTO } from "./dto/update.profile.image.dto";
import { SendFriendshipDTO } from "./dto/send.friendship.dto";
import { Friendships } from "src/entities/Friendships";
import { AcceptFriendshipDTO } from "./dto/accept.friendship.dto";
import { RejectFriendshipDTO } from "./dto/reject.friendship.dto";
import { UsersFetcher } from "./users.fetcher";
import { SharedspaceFetcher } from "src/sharedspaces/sharedspaces.fetcher";
import { getFullImageUrl } from "src/common/function/utilFunctions";

@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private dataSource: DataSource,
    private usersFetcher: UsersFetcher,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(SpaceMembers)
    private spaceMembersRepository: Repository<SpaceMembers>,
    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
    @InjectRepository(Friendships)
    private friendshipsRepository: Repository<Friendships>,
    private rolesService: RolesService,
    private storageR2Service: StorageR2Service,
    private sharedspaceFetcher: SharedspaceFetcher,
  ) {}

  async existsByEmail(email: string) {
    const user = await this.usersFetcher.getUserByEmail(email);
    return user ? true : false;
  }

  async existsByNickname(nickname: string) {
    const user = await this.usersFetcher.getUserByNickname(nickname);
    return user ? true : false;
  }

  async searchUsers(
    url: string,
    query: string,
    beforeUserId: string,
    limit = 10,
  ) {
    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

    const qb1 = this.usersRepository
      .createQueryBuilder('users')
      .select([
        'users.id AS id',
        'users.email AS email',
        'users.nickname AS nickname',
      ])
      .leftJoin('users.ProfileImage', 'ProfileImage')
      .addSelect(['ProfileImage.path AS ProfileImage'])
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

    const memberRecords = await this.spaceMembersRepository.find({
      select: {
        UserId: true,
      },
      where: {
        SpaceId: space.id,
      },
    });

    const memberSet = memberRecords.reduce((set, member) => {
      set.add(member.UserId);
      return set;
    }, new Set());

    const users = userRecords.map((user) => {
      const { id, ProfileImage, ...rest } = user;
      const transformedId = uuidToString(id);
      const url = getFullImageUrl(ProfileImage);

      return {
        ...rest,
        id: transformedId,
        ProfileImage: url,
        permission: {
          isParticipant: memberSet.has(transformedId),
        },
      };
    });

    return {
      users,
      hasMoreData,
    };
  }

  async createUser(dto: CreateUserDTO) {
    const { email, nickname, password } = dto;

    if (
      await this.existsByEmail(email) ||
      await this.existsByNickname(nickname)
    ) {
      throw new ConflictException(CONFLICT_ACCOUNT_MESSAGE);
    }

    const id = uuidv7();

    await this.usersRepository.insert({
      id,
      email,
      nickname,
      password: await bcrypt.hash(password, Number(process.env.SALT_OR_ROUNDS)),
      provider: USER_PROVIDER.LOCAL,
      status: USER_STATUS.ACTIVE,
    });

    await this.cacheManager.del(`user:${id}`);
  }

  async scheduleUserDeletion(UserId: string) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const result = await qr.manager.update(
        Users,
        { id: UserId, status: USER_STATUS.ACTIVE, },
        { status: USER_STATUS.INACTIVE, removedAt: dayjs().toDate(), },
      );

      if (!result.affected) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      await qr.manager.insert(
        BatchScheduler,
        {
          job_name: JOB_NAMES.USER_DELETE,
          job_params: JSON.stringify({ UserId }),
          status: JOB_STATUS.PENDING,
        },
      );
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async deleteRelations(
    TaskId: number,
    UserId: string,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const ownerInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.OWNER);

      const result = await qr.manager.update(
        BatchScheduler,
        { id: TaskId, status: JOB_STATUS.PENDING },
        { status: JOB_STATUS.SUCCESS },
      );

      if (!result.affected) {
        return;
      }

      const now = dayjs().unix();
      
      await qr.manager.update(
        Users,
        { id: UserId },
        { email: `_user_${now}@deleted.com`, nickname: `탈퇴한 사용자_${now}` },
      );

      await qr.manager.delete(RefreshTokens, { UserId });
      await qr.manager.delete(JoinRequests, { RequestorId: UserId });
      await qr.manager.delete(SpaceMembers, { UserId });
      await qr.manager.delete(Invites, [{ InviterId: UserId }, { InviteeId: UserId }]);

      const mySpaces = await qr.manager.find(Sharedspaces, {
        select: {
          id: true,
        },
        where: {
          OwnerId: UserId,
        },
      });

      if (mySpaces.length) {
        const result = await qr.manager.query<{ UserId: Buffer, SpaceId: Buffer, ROW_NUM: string}[]>(`
          SELECT *
          FROM (
            SELECT UserId, SpaceId, ROW_NUMBER() OVER(PARTITION BY SpaceId ORDER BY RoleId ASC, createdAt ASC) AS ROW_NUM
            FROM spacemembers
            WHERE removedAt IS NULL AND SpaceId IN (${mySpaces.map((space) => space.id).join(',')})
          ) AS oldest_members
          WHERE ROW_NUM = '1'
        `);

        const ownersToUpdateMembers = result.map(member => {
          return {
            ...member,
            SpaceId: uuidToString(member.SpaceId),
            UserId: uuidToString(member.UserId),
          };
        });

        await qr.manager
          .createQueryBuilder()
          .update(Sharedspaces)
          .set({
            OwnerId: () => `CASE id ${ownersToUpdateMembers.map(({UserId, SpaceId}) => `WHEN ${SpaceId} THEN ${UserId}`).join(' ')} ELSE OwnerId END`,
          })
          .where(`id IN (:...ids)`, { ids: ownersToUpdateMembers.map(({SpaceId}) => SpaceId) })
          .execute();
        await qr.manager.update(SpaceMembers, ownersToUpdateMembers.map(({UserId, SpaceId}) => {return { UserId, SpaceId }}), { RoleId: ownerInfo.id });

        const ownerUpdateSpacesMap = ownersToUpdateMembers.reduce((acc, member) => {
          acc[member.SpaceId] = member.UserId;
          return acc;
        }, {});

        const deleteSpaces = mySpaces.filter(space => !ownerUpdateSpacesMap[space.id]);
        await qr.manager.delete(Sharedspaces, { id: In(deleteSpaces.map(space => space.id)) });
      }

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async generateProfileImagePresignedPutUrl(
    dto: GenerateProfileImagePresignedPutUrlDTO,
    UserId: string,
  ) {
    const { id, fileName, fileSize, contentType } = dto;
    const MB = 1024 * 1024;

    if (fileSize >= 3 * MB) {
      throw new BadRequestException(PROFILE_IMAGE_TOO_LARGE_MESSAGE);
    }

    const key = this.storageR2Service.generateStorageKey(UserId, fileName);
    const presignedUrl = await this.storageR2Service.generatePresignedPutUrl(key, contentType);
    await this.imagesRepository.insert({ id, status: IMAGE_STATUS.PENDING, type: IMAGE_TYPE.PROFILE });

    return {
      key,
      presignedUrl,
      contentType,
    };
  }

  async updateProfileImage(
    dto: UpdateProfileImageDTO,
    UserId: string,
  ) {
    const { ImageId, key } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const profileImage = await qr.manager.findOne(ProfileImages,
        {
          select: {
            id: true,
            Image: {
              id: true,
            },
          },
          where: {
            UserId,
          },
          relations: {
            Image: true,
          },
        }
      );

      if (profileImage) {
        await qr.manager.update(Images,
          {
            id: profileImage.Image.id,
            status: IMAGE_STATUS.ACTIVE,
          },
          {
            status: IMAGE_STATUS.DELETED,
            removedAt: dayjs().toDate(),
          },
        );
      }

      await qr.manager.update(Images, { id: ImageId }, { status: IMAGE_STATUS.ACTIVE });
      await qr.manager.insert(ProfileImages, { id: ImageId, path: key, UserId });

      await qr.commitTransaction();

      await this.cacheManager.del(`user:${UserId}`);
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
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

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const [ id1, id2 ] = [UserId, RequesterId].sort((a, b) => a.localeCompare(b));

      await qr.manager.delete(Friendships,
        {
          RequesterId: id1,
          RequesteeId: id2,
          status: FRIENDSHIPS_STATUS.PENDING,
        },
      );

      await qr.manager.delete(Friendships,
        {
          RequesterId: id2,
          RequesteeId: id1,
          status: FRIENDSHIPS_STATUS.PENDING,
        },
      );

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }
}