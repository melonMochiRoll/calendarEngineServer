import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";
import { Users } from "src/entities/Users";
import { UserWithoutPassword } from "src/typings/types";
import { Cache } from 'cache-manager';
import { UsersService } from "src/users/users.service";

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private usersService: UsersService,
  ) {
    super();
  }

  serializeUser(user: Users, done: (err: Error, userId: number) => void) {
    return done(null, user?.id);
  };

  async deserializeUser(userId: number, done: (err: Error, user: UserWithoutPassword) => void) {
    const cached = await this.cacheManager.get(`${userId}`);
    if (cached) {
      return done(null, cached as UserWithoutPassword);
    }

    const result = await this.usersService.getOneById(userId);
    if (!result) {
      return done(null, null);
    }

    const { password, ...rest } = result;
    await this.cacheManager.set(`${userId}`, rest);

    return done(null, rest);
  };
}