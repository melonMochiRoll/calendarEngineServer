import { Injectable } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ) {
    const user = await this.usersService.getOneByEmail(email);
    const compare = await bcrypt.compare(password, user?.password);

    if (!user || !compare) {
      return null;
    }

    const { password: userPassword, ...rest } = user;
    return rest;
  }
}