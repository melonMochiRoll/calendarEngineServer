import { BadRequestException, ForbiddenException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import handleError from "src/common/function/handleError";
import { InjectRepository } from "@nestjs/typeorm";
import { Roles } from "src/entities/Roles";
import { Repository } from "typeorm";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, UNAUTHORIZED_MESSAGE } from "src/common/constant/error.message";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { ROLE_ID_MAP_KEY } from "src/common/constant/auth.constants";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";

@Injectable()
export class RolesService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(Roles)
    private rolesRepository: Repository<Roles>,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembersRepository: Repository<SharedspaceMembers>,
  ) {}

  async getRoleMap() {
    const roleIdMap = await this.cacheManager.get(ROLE_ID_MAP_KEY);

    if (roleIdMap) {
      return roleIdMap;
    }

    try {
      const roles = await this.rolesRepository.find({
        select: {
          id: true,
          name: true,
        },
      });

      const role_map = roles.reduce((map, role) => {
        map[role.id] = role.name;
        return map;
      }, {});

      if (roles) {
        await this.cacheManager.set(ROLE_ID_MAP_KEY, role_map, 0);
      }

      return role_map;
    } catch (err) {
      handleError(err);
    }
  }

  async getUserRole(
    UserId: number,
    SharedspaceId: number,
  ) {
    const cacheKey = `user:role:${UserId}:${SharedspaceId}`;
    const cachedUserRole = await this.cacheManager.get<Pick<SharedspaceMembers, 'RoleId'>>(cacheKey);

    if (cachedUserRole) {
      return cachedUserRole;
    }

    try {
      const userRole = await this.sharedspaceMembersRepository.findOne({
        select: {
          RoleId: true,
        },
        where: {
          UserId,
          SharedspaceId,
        },
      });

      if (userRole) {
        const minute = 60000;
        await this.cacheManager.set(cacheKey, userRole, 5 * minute);
      }

      return userRole;
    } catch (err) {
      handleError(err);
    }
  }

  async isParticipant(UserId: number, SpaceId: number) {
    if (!UserId) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    if (!SpaceId) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    try {
      const userRole = await this.getUserRole(UserId, SpaceId);

      if (!userRole) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }
    } catch (err) {
      handleError(err);
    }
  }
}