import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Roles } from "src/entities/Roles";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { ROLES_ARRAY_KEY } from "src/common/constant/auth.constants";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { TSharedspaceRole } from "src/typings/types";
import { CACHE_EMPTY_SYMBOL, SHAREDSPACE_ROLE } from "src/common/constant/constants";

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

  async initRoles() {
    const result = await this.rolesRepository
      .createQueryBuilder()
      .insert()
      .values([
        { id: 1, name: SHAREDSPACE_ROLE.OWNER },
        { id: 2, name: SHAREDSPACE_ROLE.MEMBER },
        { id: 3, name: SHAREDSPACE_ROLE.VIEWER },
      ])
      .orIgnore()
      .execute();
    console.log(result);
  }

  async getRolesArray() {
    const cachedrolesArray = await this.cacheManager.get<Pick<Roles, 'id' | 'name'>[]>(ROLES_ARRAY_KEY);

    if (cachedrolesArray) {
      return cachedrolesArray;
    }

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
  }

  async getUserRole(
    UserId: number,
    SharedspaceId: number,
  ) {
    const cacheKey = `user:role:${UserId}:${SharedspaceId}`;
    const cachedUserRole = await this.cacheManager.get<Pick<SharedspaceMembers, 'RoleId'> | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (cachedUserRole) {
      return cachedUserRole === CACHE_EMPTY_SYMBOL ? null : cachedUserRole;
    }

    const userRole = await this.sharedspaceMembersRepository.findOne({
      select: {
        RoleId: true,
      },
      where: {
        UserId,
        SharedspaceId,
      },
    });

    const minute = 60000;

    if (!userRole) {
      await this.cacheManager.set(cacheKey, CACHE_EMPTY_SYMBOL, 1 * minute);
      return null;
    }

    await this.cacheManager.set(cacheKey, userRole, 5 * minute);
    return userRole;
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
    roles: TSharedspaceRole[],
  ) {
    if (!UserId || !SpaceId) {
      return null;
    }

    const userRole = await this.getUserRole(UserId, SpaceId);
    const rolesArray = await this.getRolesArray() as Pick<Roles, 'id' | 'name'>[];

    if (!userRole) {
      return null;
    } 

    const role = rolesArray.find(role => role.id === userRole.RoleId);

    return roles.find(r => r === role?.name) ? role : null;
  }

  async requireOwner(UserId: number, SpaceId: number) {
    return await this.requireRole(UserId, SpaceId, [
      SHAREDSPACE_ROLE.OWNER,
    ]);
  }

  async requireMember(UserId: number, SpaceId: number) {
    return await this.requireRole(UserId, SpaceId, [
      SHAREDSPACE_ROLE.OWNER,
      SHAREDSPACE_ROLE.MEMBER,
    ]);
  }

  async requireParticipant(UserId: number, SpaceId: number) {
    return await this.requireRole(UserId, SpaceId, [
      SHAREDSPACE_ROLE.OWNER,
      SHAREDSPACE_ROLE.MEMBER,
      SHAREDSPACE_ROLE.VIEWER,
    ]);
  }

  async getRoleInfo(name: TSharedspaceRole) {
    if (!Object.values(SHAREDSPACE_ROLE).includes(name)) {
      return;
    }

    const rolesArray = await this.getRolesArray();
    return rolesArray.find(role => role.name === name);
  }
}