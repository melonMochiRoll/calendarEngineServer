import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import handleError from "src/common/function/handleError";
import { InjectRepository } from "@nestjs/typeorm";
import { Roles } from "src/entities/Roles";
import { Repository } from "typeorm";
import { BAD_REQUEST_MESSAGE, UNAUTHORIZED_MESSAGE } from "src/common/constant/error.message";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { ROLES_ARRAY_KEY } from "src/common/constant/auth.constants";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { SharedspaceMembersRoles, TSharedspaceMembersRole } from "src/typings/types";

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

  async getRolesArray() {
    const rolesArray = await this.cacheManager.get<Pick<Roles, 'id' | 'name'>[]>(ROLES_ARRAY_KEY);

    if (rolesArray) {
      return rolesArray;
    }

    try {
      const roles = await this.rolesRepository.find({
        select: {
          id: true,
          name: true,
        },
      });

      const rolesArray = roles.reduce((array, role) => {
        array.push({ id: role.id, name: role.name });
        return array;
      }, []) as Pick<Roles, 'id' | 'name'>[];

      if (roles) {
        await this.cacheManager.set(ROLES_ARRAY_KEY, rolesArray, 0);
      }

      return rolesArray;
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

  async invalidateUserRoleCache(
    UserId: number,
    SharedspaceId: number,
  ) {
    await this.cacheManager.del(`user:role:${UserId}:${SharedspaceId}`);
  }

  async requireRole(
    UserId: number,
    SpaceId: number,
    roles: TSharedspaceMembersRole[],
  ) {
    if (!UserId || !SpaceId) {
      return null;
    }

    try { 
      const userRole = await this.getUserRole(UserId, SpaceId);
      const rolesArray = await this.getRolesArray() as Pick<Roles, 'id' | 'name'>[];

      const role = rolesArray.find(role => role.id === userRole.RoleId);

      return roles.find(r => r === role?.name) ? role : null;
    } catch (err) {
      handleError(err);
    }
  }

  async requireOwner(UserId: number, SpaceId: number) {
    return await this.requireRole(UserId, SpaceId, [
      SharedspaceMembersRoles.OWNER,
    ]);
  }

  async requireMember(UserId: number, SpaceId: number) {
    return await this.requireRole(UserId, SpaceId, [
      SharedspaceMembersRoles.OWNER,
      SharedspaceMembersRoles.MEMBER,
    ]);
  }

  async requireParticipant(UserId: number, SpaceId: number) {
    return await this.requireRole(UserId, SpaceId, [
      SharedspaceMembersRoles.OWNER,
      SharedspaceMembersRoles.MEMBER,
      SharedspaceMembersRoles.VIEWER,
    ]);
  }
}