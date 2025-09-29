import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Roles } from "./entities/Roles";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { ROLE_ID_MAP_KEY } from "./common/constant/auth.constants";

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(Roles)
    private rolesRepository: Repository<Roles>,
  ) {}

  async onModuleInit() {
    console.log('onModuleInit');

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

    await this.cacheManager.set(ROLE_ID_MAP_KEY, role_map, 0);
  }
}