import { Injectable } from "@nestjs/common";
import { TUserDefault } from "src/typings/types";
import { CACHE_EMPTY_SYMBOL } from "src/common/constant/constants";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Users } from "src/entities/Users";
import { RedisClientService } from "src/redisClient/redisClient.service";

@Injectable()
export class UsersFetcher {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    private redisClientService: RedisClientService,
  ) {}

  async getUserById(id: string): Promise<TUserDefault> {
    const cacheKey = `user:${id}`;

    try {
      const cachedItem = await this.redisClientService.get<TUserDefault | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

      if (cachedItem) {
        return cachedItem === CACHE_EMPTY_SYMBOL ? null : cachedItem;
      }
    } catch (err) {
      console.error(`Redis 키 조회 실패 : ${cacheKey}`, err);
    }

    const result = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        nickname: true,
        provider: true,
        ProfileImage: {
          id: true,
          path: true,
        },
        status: true,
      },
      where: {
        id,
      },
      relations: {
        ProfileImage: {
          Image: true,
        },
      },
    });

    const user = result && {
      ...result,
      ProfileImage: result.ProfileImage?.path,
    };

    const second = 1000;
    const minute = 60000;

    try {
      if (!result) {
        await this.redisClientService.set(cacheKey, CACHE_EMPTY_SYMBOL, 3 * second);
        return null;
      }

      await this.redisClientService.set(cacheKey, user, 10 * minute);
    } catch (err) {
      console.error(`Redis 키 저장 실패 : ${cacheKey}`, err);
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<TUserDefault> {
    const cacheKey = `user:${email}`;

    try {
      const targetUserId = await this.redisClientService.get<string | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

      if (targetUserId) {
        return targetUserId === CACHE_EMPTY_SYMBOL ? null : this.getUserById(targetUserId);
      }
    } catch (err) {
      console.error(`Redis 키 조회 실패 : ${cacheKey}`, err);
    }

    const result = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        nickname: true,
        provider: true,
        ProfileImage: {
          id: true,
          path: true,
        },
        status: true,
      },
      where: {
        email,
      },
      relations: {
        ProfileImage: {
          Image: true,
        },
      },
    });

    const user = result && {
      ...result,
      ProfileImage: result.ProfileImage?.path,
    };

    const second = 1000;
    const minute = 60000;

    try {
      if (!result) {
        await this.redisClientService.set(cacheKey, CACHE_EMPTY_SYMBOL, 3 * second);
        return null;
      }

      await this.redisClientService.set(cacheKey, user.id, 10 * minute);
    } catch (err) {
      console.error(`Redis 키 저장 실패 : ${cacheKey}`, err);
    }

    return user;
  }

  async getUserByNickname(nickname: string): Promise<TUserDefault> {
    const cacheKey = `user:${nickname}`;

    try {
      const targetUserId = await this.redisClientService.get<string | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

      if (targetUserId) {
        return targetUserId === CACHE_EMPTY_SYMBOL ? null : this.getUserById(targetUserId);
      }
    } catch (err) {
      console.error(`Redis 키 조회 실패 : ${cacheKey}`, err);
    }

    const result = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        nickname: true,
        provider: true,
        ProfileImage: {
          id: true,
          path: true,
        },
        status: true,
      },
      where: {
        nickname,
      },
      relations: {
        ProfileImage: {
          Image: true,
        },
      },
    });

    const user = result && {
      ...result,
      ProfileImage: result.ProfileImage?.path,
    };

    const second = 1000;
    const minute = 60000;

    try {
      if (!result) {
        await this.redisClientService.set(cacheKey, CACHE_EMPTY_SYMBOL, 3 * second);
        return null;
      }

      await this.redisClientService.set(cacheKey, user.id, 10 * minute);
    } catch (err) {
      console.error(`Redis 키 저장 실패 : ${cacheKey}`, err);
    }

    return user;
  }
}