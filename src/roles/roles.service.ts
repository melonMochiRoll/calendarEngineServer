import { ConflictException, Inject, Injectable } from "@nestjs/common";
import handleError from "src/common/function/handleError";
import { CreateRoleDTO } from "./dto/create.role.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Roles } from "src/entities/Roles";
import { Repository } from "typeorm";
import { CONFLICT_MESSAGE } from "src/common/constant/error.message";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { ROLE_ID_MAP_KEY } from "src/common/constant/auth.constants";

@Injectable()
export class RolesService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(Roles)
    private rolesRepository: Repository<Roles>,
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
        map[role.name] = role.id;
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
  
  async createRole(dto: CreateRoleDTO) {
    try {
      const isExist = await this.rolesRepository.findOneBy({ name: dto.name });

      if (isExist) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      await this.rolesRepository.save({
        name: dto.name,
      });
    } catch (err) {
      handleError(err);
    }
  }
}