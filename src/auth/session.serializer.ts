import { Injectable } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";
import { Users } from "src/entities/Users";
import { CacheManagerService } from "src/cacheManager/cacheManager.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    private cacheManagerService: CacheManagerService,
  ) {
    super();
  }

  serializeUser(user: Users, done: CallableFunction) {
    return done(null, user?.id);
  };

  async deserializeUser(userId: number, done: CallableFunction) {
    const cached = await this.cacheManagerService.getCache(userId, 'userData');
    if (cached) {
      return done(null, cached);
    }

    const result = await this.usersRepository.findOneOrFail({
      where: { id: userId },
      select: [
        'id',
        'email',
      ],
      relations: [
        'Sharedspaces',
        'Sharedspacemembers',
      ],
    });

    if (!result) {
      return done(null, null);
    }

    await this.cacheManagerService.setCache(userId, 'userData', result);

    return done(null, result);
  };
}