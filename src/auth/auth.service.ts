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

    if (!user) {
      return null;
    }

    const compare = await bcrypt.compare(password, user.password);

    if (compare) {
      const { password, ...rest } = user;
      return rest;
    }

    return null;
  }
}