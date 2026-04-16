import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, IsNull, Repository } from "typeorm";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { nanoid } from "nanoid";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { CacheItem, SharedspaceMembersRoles, SharedspaceReturnMap } from "src/typings/types";
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
import { JOB_NAMES, JOB_STATUS, NANOID_SHAREDSPACE_URL_LENGTH, SUBSCRIBEDSPACES_SORT, USER_STATUS } from "src/common/constant/constants";
import { Todos } from "src/entities/Todos";
import { JoinRequests } from "src/entities/JoinRequests";
import { Invites } from "src/entities/Invites";
import { BatchScheduler } from "src/entities/BatchScheduler";

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
    UserId?: number,
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
    const isMember = isOwner || userRole?.name === SharedspaceMembersRoles.MEMBER;
    const isViewer = isOwner || isMember || userRole?.name === SharedspaceMembersRoles.VIEWER;

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
    UserId: number,
    page = 1,
    limit = 7,
  ) {
    const whereCondition = {
      UserId,
    };

    if (sort === SUBSCRIBEDSPACES_SORT.OWNED) {
      const rolesArray = await this.rolesService.getRolesArray();
      const ownerRole = rolesArray.find(role => role.name === SharedspaceMembersRoles.OWNER);

      Object.assign(whereCondition, { RoleId: ownerRole.id });
    }

    if (sort === SUBSCRIBEDSPACES_SORT.UNOWNED) {
      const rolesArray = await this.rolesService.getRolesArray();
      const roleIdsWithoutOwner = rolesArray
        .filter(role => role.name !== SharedspaceMembersRoles.OWNER)
        .map(role => role.id);
      
      Object.assign(whereCondition, { RoleId: In(roleIdsWithoutOwner) });
    }

    const user_roles = await this.sharedspaceMembersRepository.find({
      select: {
        SharedspaceId: true,
      },
      where: whereCondition,
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const subscribedspaces = await this.sharedspacesRepository.find({
      select: {
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
      relations: {
        Owner: true,
      },
      where: {
        id: In(user_roles.map((role) => role.SharedspaceId)),
      },
    });

    const spaces = subscribedspaces.map((space) => {
      const { OwnerId, ...rest } = space;
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

  async createSharedspace(UserId: number) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const created = await qr.manager.save(Sharedspaces, {
        url: nanoid(NANOID_SHAREDSPACE_URL_LENGTH),
        OwnerId: UserId,
      });

      const rolesArray = await this.rolesService.getRolesArray();
      const ownerRole = rolesArray.find(role => role.name === SharedspaceMembersRoles.OWNER);
      
      await qr.manager.insert(SharedspaceMembers, {
        UserId,
        SharedspaceId: created.id,
        RoleId: ownerRole.id,
      });

      await qr.commitTransaction();

      return created.url;
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
    UserId: number,
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
    UserId: number,
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

      const rolesArray = await this.rolesService.getRolesArray();
      const ownerRole = rolesArray.find(role => role.name === SharedspaceMembersRoles.OWNER);
      const memberRole = rolesArray.find(role => role.name === SharedspaceMembersRoles.MEMBER);

      await qr.manager.update(Sharedspaces, { id: space.id }, { OwnerId: newOwnerId });
      await qr.manager.update(SharedspaceMembers, { UserId: newOwnerId, SharedspaceId: space.id }, { RoleId: ownerRole.id });
      await qr.manager.update(SharedspaceMembers, { UserId: space.OwnerId, SharedspaceId: space.id }, { RoleId: memberRole.id });

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
    UserId: number,
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
    UserId: number,
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
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async deleteSharedspace(
    TaskId: number,
    SharedspaceId: number,
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
    UserId?: number,
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
    UserId: number,
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

    const rolesArray = await this.rolesService.getRolesArray();
    const role = rolesArray.find(role => role.name === RoleName);

    if (!role || role.name === SharedspaceMembersRoles.OWNER) {
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
      UserId: targetUserId,
      SharedspaceId: space.id,
      RoleId: role.id,
    });
  }

  async updateSharedspaceMembers(
    url: string,
    dto: UpdateSharedspaceMembersDTO,
    UserId: number,
  ) {
    const { UserId: targetUserId, RoleName } = dto;

    const space = await this.getSharedspaceByUrl(url);

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const rolesArray = await this.rolesService.getRolesArray();
    const role = rolesArray.find(role => role.name === RoleName);

    if (!role || role.name === SharedspaceMembersRoles.OWNER) {
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
      RoleId: role.id,
    });

    await this.rolesService.invalidateUserRoleCache(targetUserId, space.id);
  }

  async deleteSharedspaceMembers(
    url: string,
    targetUserId: number,
    UserId: number,
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

    const rolesArray = await this.rolesService.getRolesArray();
    const role = rolesArray.find(role => role.id === isMember.RoleId);

    if (!isMember || role.name === SharedspaceMembersRoles.OWNER) {
      throw new NotFoundException(NOT_FOUND_RESOURCE);
    }

    await this.sharedspaceMembersRepository.delete({
      UserId: targetUserId,
      SharedspaceId: space.id,
    });

    await this.rolesService.invalidateUserRoleCache(targetUserId, space.id);
  }
}