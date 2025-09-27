import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { IsNull, Like, Repository } from "typeorm";
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { CreateUserDTO } from "./dto/create.user.dto";
import handleError from "src/common/function/handleError";
import { ProviderList } from "src/typings/types";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>
  ) {}

  async isUser(email: string) {
    try {
      return await this.usersRepository.findOneByOrFail({ deletedAt: IsNull(), email })
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