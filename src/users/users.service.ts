import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { DataSource, In, Like, Repository } from "typeorm";
import bcrypt from 'bcrypt';
import { CreateUserDTO } from "./dto/create.user.dto";
import { ProviderList, SharedspaceMembersRoles, UserReturnMap, UserStatus } from "src/typings/types";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { CONFLICT_ACCOUNT_MESSAGE } from "src/common/constant/error.message";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { RolesService } from "src/roles/roles.service";
import { CACHE_EMPTY_SYMBOL } from "src/common/constant/constants";
import { RefreshTokens } from "src/entities/RefreshTokens";
import dayjs from "dayjs";
import { JoinRequests } from "src/entities/JoinRequests";
import { Invites } from "src/entities/Invites";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { Todos } from "src/entities/Todos";
import { Chats } from "src/entities/Chats";
import { nanoid } from "nanoid";

@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private dataSource: DataSource,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembersRepository: Repository<SharedspaceMembers>,
    private sharedspacesService: SharedspacesService,
    private rolesService: RolesService,
  ) {}

  async getUserById<T extends 'full' | 'standard' = 'standard'>(
    id: number,
    columnGroup: T = 'standard' as T,
  ): Promise<UserReturnMap<T> | null> {
    const cacheKey = `user:${id}:${columnGroup}`;

    const cachedItem = await this.cacheManager.get<UserReturnMap<T> | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (cachedItem) {
      return cachedItem === CACHE_EMPTY_SYMBOL ? null : cachedItem;
    }

    const selectClause = columnGroup === 'full' ?
      {} :
      {
        id: true,
        email: true,
        nickname: true,
        provider: true,
        profileImage: true,
      };

    const user = await this.usersRepository.findOne({
      select: selectClause,
      where: {
        id,
      },
    }) as UserReturnMap<T>;

    const minute = 60000;

    if (!user) {
      await this.cacheManager.set(cacheKey, CACHE_EMPTY_SYMBOL, 1 * minute);
      return null;
    }

    await this.cacheManager.set(cacheKey, user, 10 * minute);
    return user;
  }

  async getUserByEmail<T extends 'full' | 'standard' = 'standard'>(
    email: string,
    columnGroup: T = 'standard' as T,
  ): Promise<UserReturnMap<T> | null> {
    const cacheKey = `user:${email}:${columnGroup}`;

    const cachedItem = await this.cacheManager.get<UserReturnMap<T> | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (cachedItem) {
      return cachedItem === CACHE_EMPTY_SYMBOL ? null : cachedItem;
    }

    const selectClause = columnGroup === 'full' ?
      {} :
      {
        id: true,
        email: true,
        nickname: true,
        provider: true,
        profileImage: true,
      };

    const user = await this.usersRepository.findOne({
      select: selectClause,
      where: {
        email,
      },
    }) as UserReturnMap<T>;

    const minute = 60000;

    if (!user) {
      await this.cacheManager.set(cacheKey, CACHE_EMPTY_SYMBOL, 1 * minute);
      return null;
    }

    await this.cacheManager.set(cacheKey, user, 10 * minute);
    return user;
  }

  async getUserByNickname<T extends 'full' | 'standard' = 'standard'>(
    nickname: string,
    columnGroup: T = 'standard' as T,
  ): Promise<UserReturnMap<T> | null> {
    const cacheKey = `user:${nickname}:${columnGroup}`;

    const cachedItem = await this.cacheManager.get<UserReturnMap<T> | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (cachedItem) {
      return cachedItem === CACHE_EMPTY_SYMBOL ? null : cachedItem;
    }

    const selectClause = columnGroup === 'full' ?
      {} :
      {
        id: true,
        email: true,
        nickname: true,
        provider: true,
        profileImage: true,
      };

    const user = await this.usersRepository.findOne({
      select: selectClause,
      where: {
        nickname,
      },
    }) as UserReturnMap<T>;

    const minute = 60000;

    if (!user) {
      await this.cacheManager.set(cacheKey, CACHE_EMPTY_SYMBOL, 1 * minute);
      return null;
    }

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
        profileImage: true,
      },
      where: [
        {
          email: Like(`${query}%`)
        },
        {
          nickname: Like(`${query}%`)
        },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    const memberRecords = await this.sharedspaceMembersRepository.find({
      select: {
        UserId: true,
      },
      where: {
        SharedspaceId: space.id,
      },
    });

    const memberSet = memberRecords.reduce((set, member) => {
      set.add(member.UserId);
      return set;
    }, new Set());

    const users = userRecords.map((user) => {
      return {
        ...user,
        permission: {
          isParticipant: memberSet.has(user.id),
        },
      };
    });

    const totalCount = await this.usersRepository.count({
      where: {
        email: Like(`${query}%`),
      },
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

    await this.usersRepository.insert({
      email,
      nickname,
      password: await bcrypt.hash(password, Number(process.env.SALT_OR_ROUNDS)),
      provider: ProviderList.LOCAL,
    });
    await this.cacheManager.del(`user:${email}:standard`);
    await this.cacheManager.del(`user:${email}:full`);
    await this.cacheManager.del(`user:${nickname}:standard`);
    await this.cacheManager.del(`user:${nickname}:full`);
  }

  async pendingDelete(UserId: number) {
    await this.usersRepository.update({ id: UserId }, { status: UserStatus.INACTIVE });
  }

  async deleteRelations(UserId: number) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const rolesArray = await this.rolesService.getRolesArray();
      const ownerRole = rolesArray.find(role => role.name === SharedspaceMembersRoles.OWNER);

      await qr.manager.delete(Users, { id: UserId });
      await qr.manager.delete(RefreshTokens, { UserId });
      await qr.manager.delete(JoinRequests, { RequestorId: UserId });
      await qr.manager.delete(SharedspaceMembers, { UserId });
      await qr.manager.delete(Invites, [{ InviterId: UserId }, { InviteeId: UserId }]);
      
      await qr.manager.update(Todos, { AuthorId: UserId }, { AuthorId: 1 });
      await qr.manager.update(Todos, { EditorId: UserId }, { EditorId: 1 });

      await qr.manager.update(Chats, { SenderId: UserId }, { SenderId: 1 });

      const mySpaces = await qr.manager.find(Sharedspaces, {
        select: {
          id: true,
        },
        where: {
          OwnerId: UserId,
        },
      });

      if (mySpaces.length) {
        const ownersToUpdateMembers = await qr.manager.query<{ UserId: number, SharedspaceId: number, ROW_NUM: string}[]>(`
          SELECT *
          FROM (
            SELECT UserId, SharedspaceId, ROW_NUMBER() OVER(PARTITION BY SharedspaceId ORDER BY RoleId ASC, createdAt ASC) AS ROW_NUM
            FROM sharedspacemembers
            WHERE deletedAt IS NULL AND SharedspaceId IN (${mySpaces.map((space) => space.id).join(',')})
          ) AS oldest_members
          WHERE ROW_NUM = '1'
        `);

        await qr.manager
          .createQueryBuilder()
          .update(Sharedspaces)
          .set({
            OwnerId: () => `CASE id ${ownersToUpdateMembers.map(({UserId, SharedspaceId}) => `WHEN ${SharedspaceId} THEN ${UserId}`).join(' ')} ELSE OwnerId END`,
          })
          .where(`id IN (:...ids)`, { ids: ownersToUpdateMembers.map(({SharedspaceId}) => SharedspaceId) })
          .execute();
        await qr.manager.update(SharedspaceMembers, ownersToUpdateMembers.map(({UserId, SharedspaceId}) => {return { UserId, SharedspaceId }}), { RoleId: ownerRole.id });

        const ownerUpdateSpacesMap = ownersToUpdateMembers.reduce((acc, member) => {
          acc[member.SharedspaceId] = member.UserId;
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
}