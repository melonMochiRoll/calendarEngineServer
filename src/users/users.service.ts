import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { Repository } from "typeorm";
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { CreateUserDTO } from "./dto/create.user.dto";

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
    return await this.usersRepository.findOneByOrFail({ email })
      .then(() => true)
      .catch(() => false);
  };

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
      console.log(`createUser : ${err}`);
      throw new InternalServerErrorException(err);
    }
  };
}