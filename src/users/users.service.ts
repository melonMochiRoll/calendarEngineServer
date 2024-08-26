import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { Repository } from "typeorm";
import 'dotenv/config';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>
  ) {}

  async getOneById(
    id: number,
    ): Promise<Users> {
    return await this.usersRepository.findOneBy({ id });
  };

  async getOneByEmail(
    email: string,
    ): Promise<Users> {
    return await this.usersRepository.findOneBy({ email });
  };

  async isUser(
    email: string,
    ): Promise<boolean> {
    return await this.usersRepository.findOneBy({ email }) ? true : false;
  };

  async createUser(
    email: string,
    password: string,
  ): Promise<boolean> {
    if (await this.getOneByEmail(email)) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    try {
      const SALT_OR_ROUNDS = Number(process.env.SALT_OR_ROUNDS);

      const hash = await bcrypt.hash(password, SALT_OR_ROUNDS);
      await this.usersRepository.save({
        email,
        password: hash,
      });
      
      return true;
    } catch (err: any) {
      throw new InternalServerErrorException(err);
    }
  };
}