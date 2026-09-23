import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { INCORRECT_CREDENTIALS_MESSAGE, NOT_FOUND_USER } from "src/common/constant/error.message";
import { USER_STATUS } from "src/common/constant/constants";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { Repository } from "typeorm";
import bcrypt from 'bcrypt';

@Injectable()
export class JwtLocalStrategy extends PassportStrategy(Strategy, 'jwt-local') {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(
    email: string,
    password: string,
  ) {
    const user = await this.usersRepository.findOne({
      select: {
        id: true,
        password: true,
        status: true,
      },
      where: {
        email,
      },
      relations: {
        ProfileImage: true
      },
    });

    const compare = await bcrypt.compare(password || '', user?.password || '');

    if (!user || !compare) {
      throw new UnauthorizedException(INCORRECT_CREDENTIALS_MESSAGE);
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new BadRequestException(NOT_FOUND_USER);
    }

    return user.id;
  }
}