import { ConflictException, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { Strategy } from "passport-google-oauth20";
import { CONFLICT_ACCOUNT_MESSAGE } from "src/common/constant/error.message";
import handleError from "src/common/function/handleError";
import { Users } from "src/entities/Users";
import { ProviderList, TGoogleProfile } from "src/typings/types";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google'){
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    private usersService: UsersService,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_ORIGIN}/api/auth/login/oauth2/google/callback`,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, accessToken: string, refreshToken: string, profile: TGoogleProfile) {
    const exUser = await this.usersService.getUserByEmail(profile.emails[0].value);

    if (exUser) {
      if (exUser.provider !== ProviderList.GOOGLE) {
        throw new ConflictException(CONFLICT_ACCOUNT_MESSAGE);
      }

      return exUser;
    }

    await this.usersRepository.save({
      email: profile.emails[0].value,
      profileImage: profile._json.picture,
      provider: ProviderList.GOOGLE,
    });

    const newUser = await this.usersService.getUserByEmail(profile.emails[0].value);

    return newUser;
  }
}