import { Injectable } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";
import { Users } from "src/entities/Users";
import { UserWithoutPassword } from "src/typings/types";
import { UsersService } from "src/users/users.service";
import { CacheManagerService } from "src/cacheManager/cacheManager.service";

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(
    private usersService: UsersService,
    private cacheManagerService: CacheManagerService,
  ) {
    super();
  }

  serializeUser(user: Users, done: (err: Error, userId: number) => void) {
    return done(null, user?.id);
  };

  async deserializeUser(userId: number, done: (err: Error, user: UserWithoutPassword) => void) {
    const cached = await this.cacheManagerService.getCache(userId, 'userData');
    if (cached) {
      return done(null, cached as UserWithoutPassword);
    }

    const result = await this.usersService.getOneById(userId);
    if (!result) {
      return done(null, null);
    }

    const { password, ...rest } = result;
    await this.cacheManagerService.setCache(userId, 'userData', rest);

    return done(null, rest);
  };
}