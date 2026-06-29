import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { TUserDefault } from "src/typings/types";
import { CACHE_EMPTY_SYMBOL } from "src/common/constant/constants";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Users } from "src/entities/Users";

@Injectable()
export class UsersFetcher {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async getUserById(id: string): Promise<TUserDefault> {
    const cacheKey = `user:${id}`;

    const cachedItem = await this.cacheManager.get<TUserDefault | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (cachedItem) {
      return cachedItem === CACHE_EMPTY_SYMBOL ? null : cachedItem;
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

    const second = 1000;
    const minute = 60000;

    if (!result) {
      await this.cacheManager.set(cacheKey, CACHE_EMPTY_SYMBOL, 3 * second);
      return null;
    }

    const user = {
      ...result,
      ProfileImage: result.ProfileImage?.path,
    };

    await this.cacheManager.set(cacheKey, user, 10 * minute);
    return user;
  }

  async getUserByEmail(email: string): Promise<TUserDefault> {
    const cacheKey = `user:${email}`;

    const targetUserId = await this.cacheManager.get<string | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (targetUserId) {
      return targetUserId === CACHE_EMPTY_SYMBOL ? null : this.getUserById(targetUserId);
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

    const second = 1000;
    const minute = 60000;

    if (!result) {
      await this.cacheManager.set(cacheKey, CACHE_EMPTY_SYMBOL, 3 * second);
      return null;
    }

    const user = {
      ...result,
      ProfileImage: result.ProfileImage?.path,
    };

    await this.cacheManager.set(cacheKey, user.id, 10 * minute);
    return user;
  }

  async getUserByNickname(nickname: string): Promise<TUserDefault> {
    const cacheKey = `user:${nickname}`;

    const targetUserId = await this.cacheManager.get<string | typeof CACHE_EMPTY_SYMBOL>(cacheKey);

    if (targetUserId) {
      return targetUserId === CACHE_EMPTY_SYMBOL ? null : this.getUserById(targetUserId);
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

    const second = 1000;
    const minute = 60000;

    if (!result) {
      await this.cacheManager.set(cacheKey, CACHE_EMPTY_SYMBOL, 3 * second);
      return null;
    }

    const user = {
      ...result,
      ProfileImage: result.ProfileImage?.path,
    };

    await this.cacheManager.set(cacheKey, user.id, 10 * minute);
    return user;
  }
}