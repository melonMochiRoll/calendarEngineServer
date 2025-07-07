import { ForbiddenException, Injectable } from "@nestjs/common";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { RefreshTokens } from "src/entities/RefreshTokens";
import { TRefreshTokenPayload } from "src/typings/types";
import { Repository } from "typeorm";
import { TOKEN_EXPIRED } from "src/common/constant/error.message";
import { Users } from "src/entities/Users";
import { REFRESH_TOKEN_COOKIE_NAME } from "src/common/constant/auth.constants";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(RefreshTokens)
    private refreshTokensRepository: Repository<RefreshTokens>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.cookies[REFRESH_TOKEN_COOKIE_NAME] ? request?.cookies[REFRESH_TOKEN_COOKIE_NAME] : null;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
    dayjs.extend(isSameOrAfter);
  }

  async validate(payload: TRefreshTokenPayload) {
    const refreshTokenData = await this.refreshTokensRepository.findOne({
      where: {
        jti: payload.jti,
        UserId: payload.UserId,
      },
    });

    if (!refreshTokenData || dayjs().isSameOrAfter(dayjs(refreshTokenData.revokedAt))) {
      throw new ForbiddenException(TOKEN_EXPIRED);
    }

    const userData = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        profileImage: true,
        Sharedspacemembers: {
          SharedspaceId: true,
          Sharedspace: {
            url: true,
            private: true,
          },
          Role: {
            name: true,
          },
        },
      },
      relations: {
        Sharedspacemembers: {
          Sharedspace: true,
          Role: true,
        },
      },
      where: {
        id: payload.UserId,
      },
    });

    return userData;
  }
}