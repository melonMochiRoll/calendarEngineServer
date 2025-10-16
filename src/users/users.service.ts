import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { Like, Repository } from "typeorm";
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { CreateUserDTO } from "./dto/create.user.dto";
import handleError from "src/common/function/handleError";
import { ProviderList, UserReturnMap } from "src/typings/types";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>
  ) {}

  async getUserById<T extends 'full' | 'standard' = 'standard'>(
    id: number,
    columnGroup?: T,
  ): Promise<UserReturnMap<T>> {
    const cacheKey = `user:${id}:${columnGroup}`;

    const cachedUser = await this.cacheManager.get<UserReturnMap<T>>(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

    const selectClause = columnGroup === 'full' ?
      {} :
      {
        id: true,
        email: true,
        provider: true,
        profileImage: true,
      };

    try {
      const user = await this.usersRepository.findOne({
        select: selectClause,
        where: {
          id,
        },
      }) as UserReturnMap<T>;

      if (user) {
        const minute = 60000;
        await this.cacheManager.set(cacheKey, user, 10 * minute);
      }

      return user;
    } catch (err) {
      handleError(err);
    }
  }

  async getUserByEmail<T extends 'full' | 'standard' = 'standard'>(
    email: string,
    columnGroup?: T,
  ): Promise<UserReturnMap<T>> {
    const cacheKey = `user:${email}:${columnGroup}`;

    const cachedUser = await this.cacheManager.get<UserReturnMap<T>>(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

    const selectClause = columnGroup === 'full' ?
      {} :
      {
        id: true,
        email: true,
        provider: true,
        profileImage: true,
      };

    try {
      const user = await this.usersRepository.findOne({
        select: selectClause,
        where: {
          email,
        },
      }) as UserReturnMap<T>;

      if (user) {
        const minute = 60000;
        await this.cacheManager.set(cacheKey, user, 10 * minute);
      }

      return user;
    } catch (err) {
      handleError(err);
    }
  }

  async isUser(email: string) {
    try {
      return await this.usersRepository.findOneByOrFail({ email })
        .then(() => true)
        .catch(() => false);
    } catch (err) {
      handleError(err);
    }
  }

  async searchUsers(query: string) {
    try {
      return await this.usersRepository.find({
        select: {
          id: true,
          email: true,
          profileImage: true,
          Sharedspacemembers: {
            SharedspaceId: true,
            Role: {
              name: true,
            }
          },
        },
        relations: {
          Sharedspacemembers: {
            Role: true,
          },
        },
        where: {
          email: Like(`${query}%`),
        },
      });
    } catch (err) {
      handleError(err);
    }
  }

  async createUser(dto: CreateUserDTO) {
    const { email, password } = dto;

    try {
      const SALT_OR_ROUNDS = Number(process.env.SALT_OR_ROUNDS);
      const hash = await bcrypt.hash(password, SALT_OR_ROUNDS);

      await this.usersRepository.save({
        email,
        password: hash,
        provider: ProviderList.LOCAL,
      });
      
      return true;
    } catch (err: any) {
      handleError(err);
    }
  }
}