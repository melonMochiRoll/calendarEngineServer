import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { Strategy } from "passport-custom";
import { ACCESS_TOKEN_COOKIE_NAME, ERROR_TYPE } from "src/common/constant/auth.constants";
import { NOT_FOUND_USER, TOKEN_EXPIRED, UNAUTHORIZED_MESSAGE } from "src/common/constant/error.message";
import { TAccessTokenPayload } from "src/typings/types";
import { UsersService } from "src/users/users.service";
import dayjs from "dayjs";
import { USER_STATUS } from "src/common/constant/constants";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {
    super();
  }

  async validate(request: Request) {
    const accessToken = request?.cookies[ACCESS_TOKEN_COOKIE_NAME];
    
    if (!accessToken) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    const now = dayjs();

    const accessTokenPayload = await this.jwtService.verifyAsync<TAccessTokenPayload>(accessToken, {
      secret: process.env.JWT_SECRET,
      ignoreExpiration: true,
    });

    if (now.isSameOrAfter(dayjs(accessTokenPayload.exp, 'X'))) {
      throw new UnauthorizedException({
        message: TOKEN_EXPIRED,
        metaData: {
          type: ERROR_TYPE.TOKEN_EXPIRED,
        },
      });
    }

    const user = await this.usersService.getUserById(accessTokenPayload.UserId);

    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw new BadRequestException(NOT_FOUND_USER);
    }

    return user;
  }
}