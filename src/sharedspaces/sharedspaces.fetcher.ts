import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { CacheItem, TSharedspaceDefault } from "src/typings/types";
import dayjs from "dayjs";
import { NOT_FOUND_SPACE_MESSAGE } from "src/common/constant/error.message";
import { Sharedspaces } from "src/entities/Sharedspaces";

@Injectable()
export class SharedspaceFetcher {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
  ) {}
  private refreshLock = new Set<String>();

  async getSharedspaceById(
    id: string,
    beta = 1,
  ) {
    const cacheKey = `sharedspace:${id}`;

    const cachedItem = await this.cacheManager.get<CacheItem<TSharedspaceDefault>>(cacheKey);

    if (cachedItem) {
      const random = Math.log(Math.random());
      const threshold = dayjs().valueOf() - (cachedItem.duration * beta * random);
      const isRefresher = threshold >= cachedItem.expireTime;

      if (isRefresher && !this.refreshLock.has(cacheKey)) {
        this.refreshLock.add(cacheKey);

        try {
          await this.fetchSharedspaceAndWrite(cacheKey, id);
        } finally {
          this.refreshLock.delete(cacheKey);
        }
      }

      return cachedItem.value;
    }

    const space = await this.fetchSharedspaceAndWrite(cacheKey, id);
    return space;
  }

  async fetchSharedspaceAndWrite(cacheKey: string, id: string) {
    const start = dayjs();
    const space = await this.sharedspacesRepository.findOne({
      select: {
        id: true,
        name: true,
        private: true,
        OwnerId: true,
        createdAt: true,
      },
      where: {
        id,
        removedAt: IsNull(),
      },
    });
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

  async invalidateSharedspaceCache(id: string) {
    await this.cacheManager.del(`sharedspace:${id}`);
  }
}