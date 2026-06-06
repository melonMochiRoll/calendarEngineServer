import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import dayjs from "dayjs";
import { AUTHORIZATION_HEADER_NAME, ERROR_TYPE } from "src/common/constant/auth.constants";
import { USER_STATUS } from "src/common/constant/constants";
import { NOT_FOUND_USER, TOKEN_EXPIRED, UNAUTHORIZED_MESSAGE } from "src/common/constant/error.message";
import { TAccessTokenPayload } from "src/typings/types";
import { UsersService } from "src/users/users.service";

@Injectable()
export class SocketJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    
    const authorizationHeader = client.handshake.auth[AUTHORIZATION_HEADER_NAME];

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    const accessToken = authorizationHeader.split(' ')[1];

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

    client.user = user;

    return true;
  }
}