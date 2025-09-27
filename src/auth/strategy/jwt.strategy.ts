import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ACCESS_TOKEN_COOKIE_NAME } from "src/common/constant/auth.constants";
import { TOKEN_EXPIRED } from "src/common/constant/error.message";
import { Users } from "src/entities/Users";
import { TAccessTokenPayload } from "src/typings/types";
import { Repository } from "typeorm";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.cookies[ACCESS_TOKEN_COOKIE_NAME] ? request?.cookies[ACCESS_TOKEN_COOKIE_NAME] : null;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: TAccessTokenPayload) {
    const user = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        provider: true,
        profileImage: true,
      },
      where: {
        id: payload.UserId,
      },
    });

    if (!user) {
      throw new UnauthorizedException(TOKEN_EXPIRED);
    }

    return user;
  }
}