import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, FindOptionsWhere, In, IsNull, LessThan, Repository } from "typeorm";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { nanoid } from "nanoid";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { SpaceMembers } from "src/entities/SpaceMembers";
import { Users } from "src/entities/Users";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CONFLICT_MESSAGE, CONFLICT_OWNER_MESSAGE, NOT_FOUND_RESOURCE, UNAUTHORIZED_MESSAGE } from "src/common/constant/error.message";
import { CreateSharedspaceMembersDTO } from "./dto/create.sharedspace.members.dto";
import { UpdateSharedspaceMembersDTO } from "./dto/update.sharedspace.members.dto";
import { UpdateSharedspacePrivateDTO } from "./dto/update.sharedspace.private.dto";
import { Chats } from "src/entities/Chats";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { RolesService } from "src/roles/roles.service";
import dayjs from "dayjs";
import { JOB_NAMES, JOB_STATUS, SPACE_URL_LENGTH, SHAREDSPACE_ROLE, SUBSCRIBEDSPACES_SORT, USER_STATUS, SPACE_TYPE } from "src/common/constant/constants";
import { Todos } from "src/entities/Todos";
import { JoinRequests } from "src/entities/JoinRequests";
import { Invites } from "src/entities/Invites";
import { BatchScheduler } from "src/entities/BatchScheduler";
import { uuidv7 } from "uuidv7";
import { Spaces } from "src/entities/Spaces";
import { SharedspaceFetcher } from "./sharedspaces.fetcher";
import { stringToUUID } from "src/common/function/utilFunctions";
import { TSubscribedspacesSort } from "src/typings/types";

@Injectable()
export class SharedspacesService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private dataSource: DataSource,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Spaces)
    private spacesRepository: Repository<Spaces>,
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
    @InjectRepository(SpaceMembers)
    private spaceMembersRepository: Repository<SpaceMembers>,
    private rolesService: RolesService,
    private sharedspaceFetcher: SharedspaceFetcher,
  ) {}

  async getSharedspace(
    url: string,
    UserId?: string,
  ) {
    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

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
    sort: TSubscribedspacesSort,
    UserId: string,
    page = 1,
    limit = 7,
  ) {
    if (!sort || !Object.values(SUBSCRIBEDSPACES_SORT).includes(sort)) {
      sort = SUBSCRIBEDSPACES_SORT.ALL;
    }

    if (typeof page !== 'number') {
      page = 1;
    }

    const whereCondition: FindOptionsWhere<SpaceMembers> = {
      UserId,
      Space: {
        type: SPACE_TYPE.SHARED,
        removedAt: IsNull(),
      },
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

    const user_roles = await this.spaceMembersRepository.find({
      select: {
        id: true,
        createdAt: true,
        Space: {
          url: true,
          Sharedspace: {
            id: true,
            name: true,
            private: true,
            OwnerId: true,
            Owner: {
              email: true,
              nickname: true,
              ProfileImage: {
                id: true,
                path: true,
              },
            },
          },
        },
      },
      relations: {
        Space: {
          Sharedspace: {
            Owner: {
              ProfileImage: {
                Image: true,
              },
            },
          },
        },
      },
      where: whereCondition,
      order: {
        id: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const spaces = user_roles.map((spacemember) => {
      const { OwnerId, ...rest } = spacemember.Space.Sharedspace;
      return {
        ...rest,
        url: spacemember.Space.url,
        Owner: {
          ...rest.Owner,
          ProfileImage: rest.Owner.ProfileImage?.path,
        },
        permission: {
          isOwner: UserId === OwnerId,
        },
      };
    });

    const PAGE_GROUP_SPACES_CNT = limit * 10;

    const currentPageGroupCount = await this.spaceMembersRepository.find({
      select: { id: true },
      where: whereCondition,
      skip: Math.floor((page-1) / 10) * PAGE_GROUP_SPACES_CNT,
      take: PAGE_GROUP_SPACES_CNT + 1,
    });

    const hasNextPageGroup = currentPageGroupCount.length > PAGE_GROUP_SPACES_CNT;

    return {
      spaces,
      currentPageGroupCount: hasNextPageGroup ? PAGE_GROUP_SPACES_CNT : currentPageGroupCount.length,
      hasNextPageGroup,
    };
  }

  async createSharedspace(UserId: string) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const SpaceId = uuidv7();
      const url = nanoid(SPACE_URL_LENGTH);

      await qr.manager.insert(Spaces, {
        id: SpaceId,
        url,
        type: SPACE_TYPE.SHARED,
      });

      await qr.manager.insert(Sharedspaces, {
        id: SpaceId,
        name: '새 스페이스',
        OwnerId: UserId,
      });

      const ownerInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.OWNER);
      
      await qr.manager.insert(SpaceMembers, {
        id: uuidv7(),
        UserId,
        SpaceId,
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
    
    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

    if (space.name === name) {
      throw new ConflictException('동일한 이름으로 바꿀수 없습니다.');
    }

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    await this.sharedspacesRepository.update({ id: space.id }, { name });
    await this.sharedspaceFetcher.invalidateSharedspaceCache(url);
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
      const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

      const isOwner = await this.rolesService.requireOwner(UserId, space.id);

      if (!isOwner) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      if (space.OwnerId === newOwnerId) {
        throw new ConflictException(CONFLICT_OWNER_MESSAGE);
      }

      const ownerInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.OWNER);
      const memberInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.MEMBER);

      await qr.manager.update(Sharedspaces, { id: space.id }, { OwnerId: newOwnerId });
      await qr.manager.update(SpaceMembers, { UserId: newOwnerId, SpaceId: space.id }, { RoleId: ownerInfo.id });
      await qr.manager.update(SpaceMembers, { UserId: space.OwnerId, SpaceId: space.id }, { RoleId: memberInfo.id });

      await qr.commitTransaction();

      await this.sharedspaceFetcher.invalidateSharedspaceCache(url);
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
    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    await this.sharedspacesRepository.update({ id: space.id }, { ...dto });
    await this.sharedspaceFetcher.invalidateSharedspaceCache(url);
  }

  async scheduleSharedspaceDeletion(
    url: string,
    UserId: string,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const space = await this.spacesRepository.findOne({
        select: {
          id: true,
        },
        where: {
          url,
        },
      });

      const isOwner = await this.rolesService.requireOwner(UserId, space.id);

      if (!isOwner) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      const result = await qr.manager.update(
        Spaces,
        { id: space.id, removedAt: IsNull() },
        { removedAt: dayjs().toDate() }
      );

      if (!result.affected) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      await qr.manager.insert(
        BatchScheduler,
        {
          job_name: JOB_NAMES.SHAREDSPACE_DELETE,
          job_params: JSON.stringify({ SpaceId: space.id }),
          status: JOB_STATUS.PENDING,
        },
      );

      await qr.commitTransaction();

      await this.sharedspaceFetcher.invalidateSharedspaceCache(url);
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async deleteSharedspace(
    TaskId: number,
    SpaceId: string,
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

      await qr.manager.delete(Todos, { SpaceId });
      await qr.manager.delete(Invites, { SpaceId });
      await qr.manager.delete(JoinRequests, { SpaceId });
      await qr.manager.delete(Chats, { SpaceId });
      await qr.manager.delete(SpaceMembers, { SpaceId });
      await qr.manager.delete(Sharedspaces, { id: SpaceId });
      
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
    beforeUserId?: string,
    UserId?: string,
    limit = 10,
  ) {
    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

    if (space.private) {
      const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

      if (!isParticipant) {
        throw new ForbiddenException({
          message: ACCESS_DENIED_MESSAGE,
          metaData: { spaceUrl: space.url },
        });
      }
    }

    const memberRecords = await this.spaceMembersRepository.find({
      select: {
        id: true,
        UserId: true,
        createdAt: true,
        User: {
          email: true,
          nickname: true,
          ProfileImage: {
            id: true,
            path: true,
          },
        },
        Role: {
          name: true,
        },
      },
      where: beforeUserId ? {
        SpaceId: space.id,
        id: LessThan(beforeUserId),
        removedAt: IsNull(),
        User: {
          status: USER_STATUS.ACTIVE,
        },
      } : {
        SpaceId: space.id,
        removedAt: IsNull(),
        User: {
          status: USER_STATUS.ACTIVE,
        },
      },
      relations: {
        User: {
          ProfileImage: {
            Image: true,
          },
        },
        Role: true,
      },
      order: {
        id: 'DESC',
      },
      take: limit + 1,
    });

    const hasMoreData = memberRecords.length > limit;

    if (hasMoreData) {
      memberRecords.pop();
    }   

    const members = memberRecords.map((member) => {
      const { User, Role, ...rest } = member;
      return {
        ...rest,
        email: User.email,
        nickname: User.nickname,
        RoleName: Role.name,
        ProfileImage: User.ProfileImage?.path,
      };
    });

    return {
      members,
      hasMoreData,
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

    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const roleInfo = await this.rolesService.getRoleInfo(RoleName);

    if (!roleInfo || roleInfo.name === SHAREDSPACE_ROLE.OWNER) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const isMember = await this.spaceMembersRepository.findOne({
      select: {
        RoleId: true,
      },
      where: {
        UserId: targetUserId,
        SpaceId: space.id,
      },
    });

    if (isMember) {
      throw new ConflictException(CONFLICT_MESSAGE);
    }

    await this.spaceMembersRepository.insert({
      id: uuidv7(),
      UserId: targetUserId,
      SpaceId: space.id,
      RoleId: roleInfo.id,
    });
  }

  async updateSharedspaceMembers(
    url: string,
    dto: UpdateSharedspaceMembersDTO,
    UserId: string,
  ) {
    const { UserId: targetUserId, RoleName } = dto;

    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const roleInfo = await this.rolesService.getRoleInfo(RoleName);

    if (!roleInfo || roleInfo.name === SHAREDSPACE_ROLE.OWNER) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const isMember = await this.spaceMembersRepository.findOne({
      select: {
        RoleId: true,
      },
      where: {
        UserId: targetUserId,
        SpaceId: space.id,
      }
    });

    if (!isMember) {
      throw new NotFoundException(NOT_FOUND_RESOURCE);
    }

    await this.spaceMembersRepository.update({
      UserId: targetUserId,
      SpaceId: space.id,
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
    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

    const isOwner = await this.rolesService.requireOwner(UserId, space.id);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const isMember = await this.spaceMembersRepository.findOne({
      select: {
        RoleId: true,
      },
      where: {
        UserId: targetUserId,
        SpaceId: space.id,
      }
    });

    const ownerInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.OWNER);

    if (!isMember || isMember.RoleId === ownerInfo.id) {
      throw new NotFoundException(NOT_FOUND_RESOURCE);
    }

    const now = dayjs().toDate();

    await this.spaceMembersRepository.update(
      { UserId: targetUserId, SpaceId: space.id },
      { removedAt: now }
    );

    await this.rolesService.invalidateUserRoleCache(targetUserId, space.id);
  }
}