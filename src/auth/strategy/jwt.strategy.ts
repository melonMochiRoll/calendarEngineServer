import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { Strategy } from "passport-custom";
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "src/common/constant/auth.constants";
import { TOKEN_EXPIRED } from "src/common/constant/error.message";
import { RefreshTokens } from "src/entities/RefreshTokens";
import { TAccessTokenPayload, TRefreshTokenPayload } from "src/typings/types";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";
import dayjs from "dayjs";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private authService: AuthService,
    @InjectRepository(RefreshTokens)
    private refreshTokensRepository: Repository<RefreshTokens>,
  ) {
    super();
  }

  async validate(request: Request) {
    const accessToken = request?.cookies[ACCESS_TOKEN_COOKIE_NAME];

    try {
      const accessTokenPayload = await this.jwtService.verifyAsync<TAccessTokenPayload>(accessToken, {
        secret: process.env.JWT_SECRET,
        ignoreExpiration: false,
      });

      const user = await this.usersService.getUserById(accessTokenPayload.UserId);

      return user;
    } catch (err) {
      const refreshToken = request?.cookies[REFRESH_TOKEN_COOKIE_NAME];

      const refreshTokenPayload = await this.jwtService.verifyAsync<TRefreshTokenPayload>(refreshToken, {
        secret: process.env.JWT_SECRET,
        ignoreExpiration: false,
      });

      const refreshTokenData = await this.refreshTokensRepository.findOne({
        where: {
          jti: refreshTokenPayload.jti,
          UserId: refreshTokenPayload.UserId,
        },
      });

      if (!refreshTokenData || dayjs().isSameOrAfter(dayjs(refreshTokenData.revokedAt))) {
        throw new UnauthorizedException(TOKEN_EXPIRED);
      }

      const user = await this.usersService.getUserById(refreshTokenPayload.UserId);
      await this.authService.jwtLogin(request.res, user.id);

      return user;
    }
  }
}