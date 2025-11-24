import { ConflictException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
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
import { ACCESS_DENIED_MESSAGE, CONFLICT_ACCOUNT_MESSAGE } from "src/common/constant/error.message";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { RolesService } from "src/roles/roles.service";

@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembersRepository: Repository<SharedspaceMembers>,
    private sharedspacesService: SharedspacesService,
    private rolesService: RolesService,
  ) {}

  async getUserById<T extends 'full' | 'standard' = 'standard'>(
    id: number,
    columnGroup: T = 'standard' as T,
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

  async searchUsers(
    url: string,
    query: string,
    page = 1,
    UserId: number,
    limit = 10,
  ) {
    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      if (space.private) {
        const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

        if (!isParticipant) {
          throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
        }
      }

      const userRecords = await this.usersRepository.find({
        select: {
          id: true,
          email: true,
          profileImage: true,
        },
        where: {
          email: Like(`${query}%`),
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      const memberRecords = await this.sharedspaceMembersRepository.find({
        select: {
          UserId: true,
        },
        where: {
          SharedspaceId: space.id,
        },
      });

      const memberSet = memberRecords.reduce((set, member) => {
        set.add(member.UserId);
        return set;
      }, new Set());

      const users = userRecords.map((user) => {
        return {
          ...user,
          permission: {
            isParticipant: memberSet.has(user.id),
          },
        };
      });

      const totalCount = await this.usersRepository.count({
        where: {
          email: Like(`${query}%`),
        },
      });

      return {
        items: users,
        hasMoreData: !Boolean(page * limit >= totalCount),
      };
    } catch (err) {
      handleError(err);
    }
  }

  async createUser(dto: CreateUserDTO) {
    const { email, password } = dto;

    try {
      const exUser = await this.getUserByEmail(email);

      if (exUser) {
        throw new ConflictException(CONFLICT_ACCOUNT_MESSAGE);
      }

      const SALT_OR_ROUNDS = Number(process.env.SALT_OR_ROUNDS);
      const hash = await bcrypt.hash(password, SALT_OR_ROUNDS);

      await this.usersRepository.save({
        email,
        password: hash,
        provider: ProviderList.LOCAL,
      });
      
      return true;
    } catch (err) {
      handleError(err);
    }
  }
}