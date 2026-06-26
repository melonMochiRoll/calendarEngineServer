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
    const result = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        nickname: true,
        password: true,
        provider: true,
        ProfileImage: {
          path: true,
        },
        status: true,
      },
      where: {
        email,
      },
      relations: {
        ProfileImage: true
      },
    });

    const compare = await bcrypt.compare(password, result?.password);

    if (!result || !compare) {
      throw new UnauthorizedException(INCORRECT_CREDENTIALS_MESSAGE);
    }

    if (result.status !== USER_STATUS.ACTIVE) {
      throw new BadRequestException(NOT_FOUND_USER);
    }

    const { password: _, ProfileImage, ...rest } = result;

    const user = {
      ...rest,
      ProfileImage: ProfileImage?.path,
    };

    return user;
  }
}