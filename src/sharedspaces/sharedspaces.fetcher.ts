import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { InjectRepository } from "@nestjs/typeorm";
import { Spaces } from "src/entities/Spaces";
import { IsNull, Repository } from "typeorm";
import { CACHE_EMPTY_SYMBOL } from "src/common/constant/constants";
import { CacheItem, TSharedspaceDefault } from "src/typings/types";
import dayjs from "dayjs";
import { NOT_FOUND_SPACE_MESSAGE } from "src/common/constant/error.message";

@Injectable()
export class SharedspaceFetcher {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(Spaces)
    private spacesRepository: Repository<Spaces>,
  ) {}
  private refreshLock = new Set<String>();

  async getSpaceByUrl(url: string) {
    const cacheKey = `space:${url}`;

    const cachedItem = await this.cacheManager.get<{ id: string, url: string, type: string } | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (cachedItem) {
      return cachedItem === CACHE_EMPTY_SYMBOL ? null : cachedItem;
    }

    const space = await this.spacesRepository.findOne({
      select: {
        id: true,
        url: true,
        type: true,
      },
      where: {
        url,
      },
    });

    const minute = 60000;

    if (!space) {
      await this.cacheManager.set(cacheKey, CACHE_EMPTY_SYMBOL, 1 * minute);
      return null;
    }

    await this.cacheManager.set(cacheKey, space, 10 * minute);
    return space;
  }

  async getSharedspaceByUrl(
    url: string,
    beta = 1,
  ) {
    const cacheKey = `sharedspace:${url}`;

    const cachedItem = await this.cacheManager.get<CacheItem<TSharedspaceDefault>>(cacheKey);

    const fetchSharedspaceAndWrite = async (cacheKey: string) => {
      const start = dayjs();
      const result = await this.spacesRepository.findOne({
        select: {
          id: true,
          url: true,
          createdAt: true,
          Sharedspace: {
            name: true,
            private: true,
            OwnerId: true,
          },
        },
        where: {
          url,
          removedAt: IsNull(),
        },
        relations: {
          Sharedspace: true,
        },
      });
      const delta = dayjs().diff(start);

      if (!result) {
        throw new NotFoundException(NOT_FOUND_SPACE_MESSAGE);
      }

      const { Sharedspace, ...rest } = result;

      const space: TSharedspaceDefault = {
        ...rest,
        name: Sharedspace.name,
        private: Sharedspace.private,
        OwnerId: Sharedspace.OwnerId,
      };

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

        try {
          await fetchSharedspaceAndWrite(cacheKey);
        } finally {
          this.refreshLock.delete(cacheKey);
        }
      }

      return cachedItem.value;
    }

    const space = await fetchSharedspaceAndWrite(cacheKey);
    return space;
  }

  async invalidateSharedspaceCache(url: string) {
    await this.cacheManager.del(`sharedspace:${url}`);
  }
}