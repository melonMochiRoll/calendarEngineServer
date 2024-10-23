import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { IsNull, Like, Repository } from "typeorm";
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { CreateUserDTO } from "./dto/create.user.dto";
import handleError from "src/common/function/handleError";
import { BAD_REQUEST_MESSAGE } from "src/common/constant/error.message";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>
  ) {}

  async getOneById(id: number) {
    try {
      return await this.usersRepository.findOneBy({ id });
    } catch (err) {
      handleError(err);
    }
  }

  async getOneByEmail(email: string) {
    try {
      return await this.usersRepository.findOneBy({ email });
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
    const trimmedQuery = query.trim();

    try {
      if (!trimmedQuery) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      return await this.usersRepository.find({
        select: {
          id: true,
          email: true,
        },
        where: {
          deletedAt: IsNull(),
          email: Like(`${trimmedQuery}%`),
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
      });
      
      return true;
    } catch (err: any) {
      handleError(err);
    }
  }
}