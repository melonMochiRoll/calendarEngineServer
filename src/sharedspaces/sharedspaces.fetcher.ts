import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { CacheItem, TSharedspaceDefault } from "src/typings/types";
import dayjs from "dayjs";
import { NOT_FOUND_SPACE_MESSAGE } from "src/common/constant/error.message";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { RedisClientService } from "src/redisClient/redisClient.service";
import { nanoid } from "nanoid";

@Injectable()
export class SharedspaceFetcher {
  constructor(
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
    private redisClientService: RedisClientService,
  ) {}

  async getSharedspaceById(
    id: string,
    beta = 1,
  ) {
    const cacheKey = `sharedspace:${id}`;

    const cachedItem = await this.redisClientService.get<CacheItem<TSharedspaceDefault>>(cacheKey);

    if (cachedItem) {
      const random = Math.log(Math.random());
      const threshold = dayjs().valueOf() - (cachedItem.duration * beta * random);
      const isRefresher = threshold >= cachedItem.expireTime;

      const lockKey = `lock:${cacheKey}`;
      const isLocked = isRefresher && await this.redisClientService.setIfNotExist(lockKey, nanoid());

      if (isLocked === 'OK') {
        this.fetchSharedspaceAndWrite(cacheKey, id)
          .catch((err) => {
            console.log(err);
          })
          .finally(async () => {
            await this.redisClientService.del(lockKey);
          });
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
        SharedspaceChatRooms: {
          id: true,
          name: true,
        },
      },
      where: {
        id,
        removedAt: IsNull(),
        SharedspaceChatRooms: {
          ChatRoom: {
            removedAt: IsNull(), 
          },
        },
      },
      relations: {
        SharedspaceChatRooms: true,
      },
      order: {
        SharedspaceChatRooms: {
          id: 'ASC',
        },
      },
    });
    const delta = dayjs().diff(start);

    if (!space) {
      throw new NotFoundException(NOT_FOUND_SPACE_MESSAGE);
    }

    const minute = 60000;
    const ttl = 5 * minute;

    await this.redisClientService.set(cacheKey, {
      value: space,
      duration: delta,
      expireTime: dayjs().valueOf() + ttl,
    }, ttl);

    return space;
  }

  async invalidateSharedspaceCache(id: string) {
    await this.redisClientService.del(`sharedspace:${id}`);
  }

  async invalidateSharedspaceMembersCache(SharedspaceId: string) {
    await this.redisClientService.del(`sharedspaceMembers:${SharedspaceId}`);
  }
}