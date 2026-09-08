import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { Strategy } from "passport-custom";
import { AUTHORIZATION_HEADER_NAME, ERROR_TYPE } from "src/common/constant/auth.constants";
import { TOKEN_EXPIRED, UNAUTHORIZED_MESSAGE } from "src/common/constant/error.message";
import { TAccessTokenPayload } from "src/typings/types";
import dayjs from "dayjs";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor( 
    private jwtService: JwtService,
  ) {
    super();
  }

  async validate(request: Request) {
    const authorizationHeader = request.headers[AUTHORIZATION_HEADER_NAME];
    
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
          type: ERROR_TYPE.AUTH_TOKEN_EXPIRED,
        },
      });
    }

    return accessTokenPayload.UserId;
  }
}