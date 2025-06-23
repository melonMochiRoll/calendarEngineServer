import { BadRequestException, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { BAD_REQUEST_MESSAGE } from "src/common/constant/error.message";
import { Users } from "src/entities/Users";
import { JwtPayload } from "src/typings/types";
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
          return request?.cookies['accessToken'] ? request?.cookies['accessToken'] : null;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
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
        id: payload.id,
      },
    });

    if (!userData) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    return userData;
  }
}