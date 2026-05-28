import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { DataSource, In, Like, Repository } from "typeorm";
import bcrypt from 'bcrypt';
import { CreateUserDTO } from "./dto/create.user.dto";
import { TUserDefault } from "src/typings/types";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { CONFLICT_ACCOUNT_MESSAGE, CONFLICT_MESSAGE, PROFILE_IMAGE_TOO_LARGE_MESSAGE } from "src/common/constant/error.message";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { SpaceMembers } from "src/entities/SpaceMembers";
import { RolesService } from "src/roles/roles.service";
import { CACHE_EMPTY_SYMBOL, IMAGE_STATUS, IMAGE_TYPE, JOB_NAMES, JOB_STATUS, SHAREDSPACE_ROLE, USER_PROVIDER, USER_STATUS } from "src/common/constant/constants";
import { RefreshTokens } from "src/entities/RefreshTokens";
import { JoinRequests } from "src/entities/JoinRequests";
import { Invites } from "src/entities/Invites";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { Todos } from "src/entities/Todos";
import { Chats } from "src/entities/Chats";
import { BatchScheduler } from "src/entities/BatchScheduler";
import dayjs from "dayjs";
import { uuidv7 } from "uuidv7";
import { uuidToString } from "src/common/function/uuidv7Transformer"
import { ProfileImages } from "src/entities/ProfileImages";
import { Images } from "src/entities/Images";
import { GenerateProfileImagePresignedPutUrlDTO } from "./dto/generate.profileImage.presigned.put.url.dto";
import { StorageR2Service } from "src/storage/storage.r2.service";
import { UpdateProfileImageDTO } from "./dto/update.profile.image.dto";
import { getR2PublicURL } from "src/common/function/getStorageURL";

@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private dataSource: DataSource,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(SpaceMembers)
    private spaceMembersRepository: Repository<SpaceMembers>,
    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
    @InjectRepository(ProfileImages)
    private profileImagesRepository: Repository<ProfileImages>,
    private sharedspacesService: SharedspacesService,
    private rolesService: RolesService,
    private storageR2Service: StorageR2Service,
  ) {}

  async getUserById(id: string): Promise<TUserDefault> {
    const cacheKey = `user:${id}`;

    const cachedItem = await this.cacheManager.get<TUserDefault | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (cachedItem) {
      return cachedItem === CACHE_EMPTY_SYMBOL ? null : cachedItem;
    }

    const result = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        nickname: true,
        provider: true,
        ProfileImage: {
          id: true,
          Image: {
            path: true,
          },
        },
        status: true,
      },
      where: {
        id,
      },
      relations: {
        ProfileImage: {
          Image: true,
        },
      },
    });

    const minute = 60000;

    if (!result) {
      await this.cacheManager.set(cacheKey, CACHE_EMPTY_SYMBOL, 1 * minute);
      return null;
    }

    const user = {
      ...result,
      ProfileImage: result.ProfileImage ? `${getR2PublicURL()}/${result.ProfileImage?.Image?.path}` : '',
    };

    await this.cacheManager.set(cacheKey, user, 10 * minute);
    return user;
  }

  async getUserByEmail(email: string): Promise<TUserDefault> {
    const cacheKey = `user:${email}`;

    const cachedItem = await this.cacheManager.get<TUserDefault | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (cachedItem) {
      return cachedItem === CACHE_EMPTY_SYMBOL ? null : cachedItem;
    }

    const result = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        nickname: true,
        provider: true,
        ProfileImage: {
          id: true,
          Image: {
            path: true,
          },
        },
        status: true,
      },
      where: {
        email,
      },
      relations: {
        ProfileImage: {
          Image: true,
        },
      },
    });

    const minute = 60000;

    if (!result) {
      await this.cacheManager.set(cacheKey, CACHE_EMPTY_SYMBOL, 1 * minute);
      return null;
    }

    const user = {
      ...result,
      ProfileImage: result.ProfileImage ? `${getR2PublicURL()}/${result.ProfileImage?.Image?.path}` : '',
    };

    await this.cacheManager.set(cacheKey, user, 10 * minute);
    return user;
  }

  async getUserByNickname(nickname: string): Promise<TUserDefault> {
    const cacheKey = `user:${nickname}`;

    const cachedItem = await this.cacheManager.get<TUserDefault | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (cachedItem) {
      return cachedItem === CACHE_EMPTY_SYMBOL ? null : cachedItem;
    }

    const result = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        nickname: true,
        provider: true,
        ProfileImage: {
          id: true,
          Image: {
            path: true,
          },
        },
        status: true,
      },
      where: {
        nickname,
      },
      relations: {
        ProfileImage: {
          Image: true,
        },
      },
    });

    const minute = 60000;

    if (!result) {
      await this.cacheManager.set(cacheKey, CACHE_EMPTY_SYMBOL, 1 * minute);
      return null;
    }

    const user = {
      ...result,
      ProfileImage: result.ProfileImage ? `${getR2PublicURL()}/${result.ProfileImage?.Image?.path}` : '',
    };

    await this.cacheManager.set(cacheKey, user, 10 * minute);
    return user;
  }

  async existsByEmail(email: string) {
    const user = await this.getUserByEmail(email);
    return user ? true : false;
  }

  async existsByNickname(nickname: string) {
    const user = await this.getUserByNickname(nickname);
    return user ? true : false;
  }

  async searchUsers(
    url: string,
    query: string,
    page = 1,
    limit = 10,
  ) {
    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const userRecords = await this.usersRepository.find({
      select: {
        id: true,
        email: true,
        nickname: true,
        ProfileImage: {
          id: true,
          Image: {
            path: true,
          },
        },
      },
      where: [
        {
          email: Like(`${query}%`),
          status: USER_STATUS.ACTIVE,
        },
        {
          nickname: Like(`${query}%`),
          status: USER_STATUS.ACTIVE,
        },
      ],
      relations: {
        ProfileImage: {
          Image: true,
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

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
      return {
        ...user,
        ProfileImage: `${getR2PublicURL()}/${user.ProfileImage?.Image?.path}`,
        permission: {
          isParticipant: memberSet.has(user.id),
        },
      };
    });

    const totalCount = await this.usersRepository.count({
      where: [
        {
          email: Like(`${query}%`),
          status: USER_STATUS.ACTIVE,
        },
        {
          nickname: Like(`${query}%`),
          status: USER_STATUS.ACTIVE,
        },
      ],
    });

    return {
      items: users,
      hasMoreData: !Boolean(page * limit >= totalCount),
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
    await this.cacheManager.del(`user:${email}`);
    await this.cacheManager.del(`user:${nickname}`);
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
        const result = await qr.manager.query<{ UserId: Buffer, SpaceId: number, ROW_NUM: string}[]>(`
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

    if (fileSize >= 3 * 1024 * 1024) {
      throw new BadRequestException(PROFILE_IMAGE_TOO_LARGE_MESSAGE);
    }

    const key = this.storageR2Service.generateStorageKey(UserId, fileName);
    const presignedUrl = await this.storageR2Service.generatePresignedPutUrl(key, contentType);
    await this.imagesRepository.insert({ id, status: IMAGE_STATUS.PENDING, path: key, type: IMAGE_TYPE.PROFILE });

    return {
      presignedUrl,
      contentType,
    };
  }

  async updateProfileImage(
    dto: UpdateProfileImageDTO,
    UserId: string,
  ) {
    const { ImageId } = dto;

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
      await qr.manager.upsert(ProfileImages, { id: ImageId, UserId }, ['id', 'UserId']);

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }
}