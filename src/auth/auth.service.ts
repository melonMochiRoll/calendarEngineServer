import { Injectable } from "@nestjs/common";
import bcrypt from 'bcrypt';
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { Repository } from "typeorm";
import handleError from "src/common/function/handleError";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>
  ) {}

  async validateUser(
    email: string,
    password: string,
  ) {
    try {
      const user = await this.usersRepository.findOne({
        where: { email },
        select: ['id', 'email', 'password'],
      });
      const compare = await bcrypt.compare(password, user?.password || '');
  
      if (!user || !compare) {
        return null;
      }
  
      const { password: userPassword, ...rest } = user;
      return rest;
    } catch (err) {
      handleError(err);
    }
  }
}