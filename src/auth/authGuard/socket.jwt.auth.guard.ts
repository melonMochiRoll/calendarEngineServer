import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import dayjs from "dayjs";
import { AUTHORIZATION_HEADER_NAME, ERROR_TYPE } from "src/common/constant/auth.constants";
import { USER_STATUS } from "src/common/constant/constants";
import { NOT_FOUND_RESOURCE, TOKEN_EXPIRED } from "src/common/constant/error.message";
import { TAccessTokenPayload } from "src/typings/types";
import { UsersFetcher } from "src/users/users.fetcher";

@Injectable()
export class SocketJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersFetcher: UsersFetcher,
  ) {}

  async canActivate(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    
    const authorizationHeader = client.handshake.auth[AUTHORIZATION_HEADER_NAME];

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new WsException({
        type: ERROR_TYPE.UNAUTHORIZED_ERROR,
        message: TOKEN_EXPIRED,
      });
    }

    const accessToken = authorizationHeader.split(' ')[1];

    const now = dayjs();

    const accessTokenPayload = await this.jwtService.verifyAsync<TAccessTokenPayload>(accessToken, {
      secret: process.env.JWT_SECRET,
      ignoreExpiration: true,
    });

    if (now.isSameOrAfter(dayjs(accessTokenPayload.exp, 'X'))) {
      throw new WsException({
        type: ERROR_TYPE.AUTH_TOKEN_EXPIRED,
        message: TOKEN_EXPIRED,
      });
    }

    const user = await this.usersFetcher.getUserById(accessTokenPayload.UserId);

    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw new WsException({
        type: ERROR_TYPE.UNAUTHORIZED_ERROR,
        message: NOT_FOUND_RESOURCE,
      });
    }

    client.user = user;

    return true;
  }
}