import { ConflictException, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { Strategy } from "passport-naver";
import { CONFLICT_ACCOUNT_MESSAGE } from "src/common/constant/error.message";
import { Users } from "src/entities/Users";
import { ProviderList, TNaverProfile } from "src/typings/types";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    private usersService: UsersService,
  ) {
    super({
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_ORIGIN}/api/auth/login/oauth2/naver/callback`,
      profileURL: 'https://openapi.naver.com/v1/nid/me',
      authType: 'reprompt',
      passReqToCallback: true,
    })
  }

  async validate(req: Request, accessToken: string, refreshToken: string, profile: TNaverProfile) {
    const exUser = await this.usersService.getUserByEmail(profile.emails[0].value);

    if (exUser) {
      if (exUser.provider !== ProviderList.NAVER) {
        throw new ConflictException(CONFLICT_ACCOUNT_MESSAGE);
      }

      return exUser;
    }
    
    await this.usersRepository.save({
      email: profile.emails[0].value,
      profileImage: profile._json.profile_image,
      provider: ProviderList.NAVER,
    });

    const newUser = await this.usersService.getUserByEmail(profile.emails[0].value);

    return newUser;
  }
}