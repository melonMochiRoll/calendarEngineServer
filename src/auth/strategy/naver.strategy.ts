import { ConflictException, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { Strategy } from "passport-naver";
import { CONFLICT_ACCOUNT_MESSAGE } from "src/common/constant/error.message";
import handleError from "src/common/function/handleError";
import { Users } from "src/entities/Users";
import { ProviderList, TNaverProfile } from "src/typings/types";
import { Repository } from "typeorm";

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>
  ) {
    super({
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      profileURL: 'https://openapi.naver.com/v1/nid/me',
      authType: 'reprompt',
      passReqToCallback: true,
    })
  }

  async validate(req: Request, accessToken: string, refreshToken: string, profile: TNaverProfile) {
    try {
      const exUser = await this.usersRepository.findOne({
        select: {
          id: true,
          email: true,
          provider: true,
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
          email: profile.emails[0].value,
        },
      });

      if (!exUser) {
        await this.usersRepository.save({
          email: profile.emails[0].value,
          profileImage: profile._json.profile_image,
          provider: ProviderList.NAVER,
        });

        const newUser = await this.usersRepository.findOne({
          select: {
            id: true,
            email: true,
            provider: true,
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
            email: profile.emails[0].value,
          },
        });

        return newUser;
      }

      if (exUser.provider !== ProviderList.NAVER) {
        throw new ConflictException(CONFLICT_ACCOUNT_MESSAGE);
      }

      return exUser;
    } catch (err) {
      handleError(err);
    }
  }
}