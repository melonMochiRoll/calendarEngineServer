import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, FindOptionsWhere, In, IsNull, Repository } from "typeorm";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { nanoid } from "nanoid";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { CacheItem, SharedspaceReturnMap } from "src/typings/types";
import { Users } from "src/entities/Users";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CONFLICT_MESSAGE, CONFLICT_OWNER_MESSAGE, NOT_FOUND_RESOURCE, NOT_FOUND_SPACE_MESSAGE, UNAUTHORIZED_MESSAGE } from "src/common/constant/error.message";
import { CreateSharedspaceMembersDTO } from "./dto/create.sharedspace.members.dto";
import { UpdateSharedspaceMembersDTO } from "./dto/update.sharedspace.members.dto";
import { UpdateSharedspacePrivateDTO } from "./dto/update.sharedspace.private.dto";
import { Chats } from "src/entities/Chats";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { RolesService } from "src/roles/roles.service";
import dayjs from "dayjs";
import { JOB_NAMES, JOB_STATUS, NANOID_PUBLIC_ID_LENGTH, SHAREDSPACE_ROLE, SUBSCRIBEDSPACES_SORT, USER_STATUS } from "src/common/constant/constants";
import { Todos } from "src/entities/Todos";
import { JoinRequests } from "src/entities/JoinRequests";
import { Invites } from "src/entities/Invites";
import { BatchScheduler } from "src/entities/BatchScheduler";
import { uuidv7 } from "uuidv7";

@Injectable()
export class SharedspacesService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private dataSource: DataSource,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembersRepository: Repository<SharedspaceMembers>,
    private rolesService: RolesService,
  ) {}
  private refreshLock = new Set<String>();

  async getSharedspaceByUrl<T extends 'full' | 'standard' = 'standard'>(
    url: string,
    columnGroup: T = 'standard' as T,
    beta = 1,
  ): Promise<SharedspaceReturnMap<T>> {
    const cacheKey = `sharedspace:${url}:${columnGroup}`;

    const cachedItem = await this.cacheManager.get<CacheItem<SharedspaceReturnMap<T>>>(cacheKey);

    const fetchSharedspaceAndWrite = async (cacheKey: string) => {
      const selectClause = columnGroup === 'full' ?
        {} :
        {
          id: true,
          name: true,
          url: true,
          private: true,
          createdAt: true,
          OwnerId: true,
        };

      const start = dayjs();
      const space = await this.sharedspacesRepository.findOne({
        select: selectClause,
        where: {
          url,
          removedAt: IsNull(),
        },
      }) as SharedspaceReturnMap<T>;
      const delta = dayjs().diff(start);

      if (!space) {
        throw new NotFoundException(NOT_FOUND_SPACE_MESSAGE);
      }

      const minute = 60000;
      const ttl = 0.1 * minute;

      await this.cacheManager.set(cacheKey, {
        value: space,
        duration: delta,
        expireTime: dayjs().valueOf() + ttl,
      }, ttl);

      return space;
    }

    if (cachedItem) {
      const random = Math.log(Math.random());
      const threshold = dayjs().valueOf() - (cachedItem.duration * beta * random);
      const isRefresher = threshold >= cachedItem.expireTime;

      if (isRefresher && !this.refreshLock.has(cacheKey)) {
        this.refreshLock.add(cacheKey);

        fetchSharedspaceAndWrite(cacheKey)
          .finally(() => {
            this.refreshLock.delete(cacheKey);
          });
      }

      return cachedItem.value;
    }

    const space = await fetchSharedspaceAndWrite(cacheKey);
    return space;
  }

  async invalidateSharedspaceCache(url: string) {
    await this.cacheManager.del(`sharedspace:${url}:full`);
    await this.cacheManager.del(`sharedspace:${url}:standard`);
  }

  async getSharedspace(
    url: string,
    UserId?: string,
  ) {
    const space = await this.getSharedspaceByUrl(url);

    if (!UserId && space.private) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    const userRole = await this.rolesService.requireParticipant(UserId, space.id);

    if (!userRole && space.private) {
      throw new ForbiddenException({
        message: ACCESS_DENIED_MESSAGE,
        metaData: { spaceUrl: space.url },
      });
    }

    const isOwner = space.OwnerId === UserId;
    const isMember = isOwner || userRole?.name === SHAREDSPACE_ROLE.MEMBER;
    const isViewer = isOwner || isMember || userRole?.name === SHAREDSPACE_ROLE.VIEWER;

    return {
      ...space,
      permission: {
        isOwner,
        isMember,
        isViewer,
      },
    };
  }

  async getSubscribedspaces(
    sort: string,
    UserId: string,
    page = 1,
    limit = 7,
  ) {
    const whereCondition: FindOptionsWhere<SharedspaceMembers> = {
      UserId,
      removedAt: IsNull(),
    };

    if (sort === SUBSCRIBEDSPACES_SORT.OWNED) {
      const ownerInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.OWNER);

      Object.assign(whereCondition, { RoleId: ownerInfo.id });
    }

    if (sort === SUBSCRIBEDSPACES_SORT.UNOWNED) {
      const rolesArray = await this.rolesService.getRolesArray();
      const roleIdsWithoutOwner = rolesArray
        .filter(role => role.name !== SHAREDSPACE_ROLE.OWNER)
        .map(role => role.id);
      
      Object.assign(whereCondition, { RoleId: In(roleIdsWithoutOwner) });
    }

    const user_roles = await this.sharedspaceMembersRepository.find({
      select: {
        id: true,
        SharedspaceId: true,
        createdAt: true,
        Sharedspace: {
          name: true,
          url: true,
          private: true,
          OwnerId: true,
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
      where: whereCondition,
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const spaces = user_roles.map((space) => {
      const { OwnerId, ...rest } = space.Sharedspace;
      return {
        ...rest,
        permission: {
          isOwner: UserId === OwnerId,
        },
      };
    });

    const totalCount = await this.sharedspaceMembersRepository.count({
      where: whereCondition,
    });

    return { spaces, totalCount };
  }

  async createSharedspace(UserId: string) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const SharedspaceId = uuidv7();
      const url = nanoid(NANOID_PUBLIC_ID_LENGTH);

      await qr.manager.insert(Sharedspaces, {
        id: SharedspaceId,
        url,
        OwnerId: UserId,
      });

      const ownerInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.OWNER);
      
      await qr.manager.insert(SharedspaceMembers, {
        id: uuidv7(),
        UserId,
        SharedspaceId,
        RoleId: ownerInfo.id,
      });

      await qr.commitTransaction();

      return url;
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async updateSharedspaceName(
    url: string,
    dto: UpdateSharedspaceNameDTO,
    UserId: string,
  ) {
    const { name } = dto;
    
    const space = await this.getSharedspaceByUrl(url);

    if (space.name === name) {
      throw new ConflictException('동일한 이름으로 바꿀수 없습니다.');
    }

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    await this.sharedspacesRepository.update({ id: space.id }, { name });
    await this.invalidateSharedspaceCache(url);
  }

  async updateSharedspaceOwner(
    url: string,
    dto: UpdateSharedspaceOwnerDTO,
    UserId: string,
  ) {
    const { newOwnerId } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const space = await this.getSharedspaceByUrl(url);

      const isOwner = await this.rolesService.requireOwner(UserId, space.id);

      if (!isOwner) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      if (space.OwnerId !== UserId) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      if (space.OwnerId === newOwnerId) {
        throw new ConflictException(CONFLICT_OWNER_MESSAGE);
      }

      const ownerInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.OWNER);
      const memberInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.MEMBER);

      await qr.manager.update(Sharedspaces, { id: space.id }, { OwnerId: newOwnerId });
      await qr.manager.update(SharedspaceMembers, { UserId: newOwnerId, SharedspaceId: space.id }, { RoleId: ownerInfo.id });
      await qr.manager.update(SharedspaceMembers, { UserId: space.OwnerId, SharedspaceId: space.id }, { RoleId: memberInfo.id });

      await qr.commitTransaction();

      await this.invalidateSharedspaceCache(url);
      await this.rolesService.invalidateUserRoleCache(space.OwnerId, space.id);
      await this.rolesService.invalidateUserRoleCache(newOwnerId, space.id);
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async updateSharedspacePrivate(
    url: string,
    dto: UpdateSharedspacePrivateDTO,
    UserId: string,
  ) {
    const space = await this.getSharedspaceByUrl(url);

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    await this.sharedspacesRepository.update({ id: space.id }, { ...dto });
    await this.invalidateSharedspaceCache(url);
  }

  async scheduleSharedspaceDeletion(
    url: string,
    UserId: string,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const space = await this.getSharedspaceByUrl(url);

      const isOwner = await this.rolesService.requireOwner(UserId, space.id);

      if (!isOwner) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      const result = await qr.manager.update(
        Sharedspaces,
        { url, removedAt: IsNull() },
        { removedAt: dayjs().toDate() },
      );

      if (!result.affected) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      await qr.manager.insert(
        BatchScheduler,
        {
          job_name: JOB_NAMES.SHAREDSPACE_DELETE,
          job_params: JSON.stringify({ SharedspaceId: space.id }),
          status: JOB_STATUS.PENDING,
        },
      );

      await qr.commitTransaction();

      await this.invalidateSharedspaceCache(url);
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async deleteSharedspace(
    TaskId: number,
    SharedspaceId: string,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    
    try {
      const result = await qr.manager.update(
        BatchScheduler,
        { id: TaskId, status: JOB_STATUS.PENDING },
        { status: JOB_STATUS.SUCCESS },
      );

      if (!result.affected) {
        return;
      }

      await qr.manager.delete(Invites, { SharedspaceId });
      await qr.manager.delete(Chats, { SharedspaceId });
      await qr.manager.delete(Todos, { SharedspaceId });
      await qr.manager.delete(JoinRequests, { SharedspaceId });
      await qr.manager.delete(SharedspaceMembers, { SharedspaceId });
      await qr.manager.delete(Sharedspaces, { SharedspaceId });
      
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async getSharedspaceMembers(
    url: string,
    page = 1,
    UserId?: string,
    limit = 10,
  ) {
    const space = await this.getSharedspaceByUrl(url);

    if (space.private) {
      const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

      if (!isParticipant) {
        throw new ForbiddenException({
          message: ACCESS_DENIED_MESSAGE,
          metaData: { spaceUrl: space.url },
        });
      }
    }

    const memberRecords = await this.sharedspaceMembersRepository.find({
      select: {
        UserId: true,
        SharedspaceId: true,
        createdAt: true,
        User: {
          email: true,
          nickname: true,
          profileImage: true,
        },
        Role: {
          name: true,
        },
      },
      where: {
        SharedspaceId: space.id,
        removedAt: IsNull(),
        User: {
          status: USER_STATUS.ACTIVE,
        },
      },
      relations: {
        User: true,
        Role: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const members = memberRecords.map((member) => {
      const { User, Role, ...rest } = member;
      return {
        ...rest,
        email: User.email,
        nickname: User.nickname,
        profileImage: User.profileImage,
        RoleName: Role.name,
      };
    });

    const totalCount = await this.sharedspaceMembersRepository.count({
      where: {
        SharedspaceId: space.id,
      },
    });

    return {
      items: members,
      hasMoreData: !Boolean(page * limit >= totalCount),
    };
  }

  async createSharedspaceMembers(
    url: string,
    dto: CreateSharedspaceMembersDTO,
    UserId: string,
  ) {
    const { UserId: targetUserId, RoleName } = dto;

    const targetUser = await this.usersRepository.find({
      select: {
        id: true,
      },
      where: {
        id: targetUserId,
      },
    });

    if (!targetUser) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const space = await this.getSharedspaceByUrl(url);

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const roleInfo = await this.rolesService.getRoleInfo(RoleName);

    if (!roleInfo || roleInfo.name === SHAREDSPACE_ROLE.OWNER) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const isMember = await this.sharedspaceMembersRepository.findOne({
      select: {
        RoleId: true,
      },
      where: {
        UserId: targetUserId,
        SharedspaceId: space.id,
      },
    });

    if (isMember) {
      throw new ConflictException(CONFLICT_MESSAGE);
    }

    await this.sharedspaceMembersRepository.insert({
      id: uuidv7(),
      UserId: targetUserId,
      SharedspaceId: space.id,
      RoleId: roleInfo.id,
    });
  }

  async updateSharedspaceMembers(
    url: string,
    dto: UpdateSharedspaceMembersDTO,
    UserId: string,
  ) {
    const { UserId: targetUserId, RoleName } = dto;

    const space = await this.getSharedspaceByUrl(url);

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const roleInfo = await this.rolesService.getRoleInfo(RoleName);

    if (!roleInfo || roleInfo.name === SHAREDSPACE_ROLE.OWNER) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const isMember = await this.sharedspaceMembersRepository.findOne({
      select: {
        RoleId: true,
      },
      where: {
        UserId: targetUserId,
        SharedspaceId: space.id,
      }
    });

    if (!isMember) {
      throw new NotFoundException(NOT_FOUND_RESOURCE);
    }

    await this.sharedspaceMembersRepository.update({
      UserId: targetUserId,
      SharedspaceId: space.id,
    },{
      RoleId: roleInfo.id,
    });

    await this.rolesService.invalidateUserRoleCache(targetUserId, space.id);
  }

  async deleteSharedspaceMembers(
    url: string,
    targetUserId: string,
    UserId: string,
  ) {
    const space = await this.getSharedspaceByUrl(url);

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const isMember = await this.sharedspaceMembersRepository.findOne({
      select: {
        RoleId: true
      },
      where: {
        UserId: targetUserId,
        SharedspaceId: space?.id,
      }
    });

    const ownerInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.OWNER);

    if (!isMember || isMember.RoleId === ownerInfo.id) {
      throw new NotFoundException(NOT_FOUND_RESOURCE);
    }

    const now = dayjs().toDate();

    await this.sharedspaceMembersRepository.update(
      { UserId: targetUserId, SharedspaceId: space.id },
      { removedAt: now }
    );

    await this.rolesService.invalidateUserRoleCache(targetUserId, space.id);
  }
}