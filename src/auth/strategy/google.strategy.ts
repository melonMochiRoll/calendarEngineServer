import { ConflictException, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { Strategy } from "passport-google-oauth20";
import { CONFLICT_ACCOUNT_MESSAGE } from "src/common/constant/error.message";
import handleError from "src/common/function/handleError";
import { Users } from "src/entities/Users";
import { ProviderList, TGoogleProfile } from "src/typings/types";
import { Repository } from "typeorm";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google'){
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>
  ) {
    super({
      clientID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:9000/login/oauth2/google',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: TGoogleProfile) {
    try {
      const exUser = await this.usersRepository.findOneBy({ email: profile.emails[0].value });

      if (!exUser) {
        const newUser = await this.usersRepository.save({
          email: profile.emails[0].value,
          profileImage: profile._json.picture,
          provider: ProviderList.GOOGLE,
        });

        return newUser;
      }

      if (exUser.provider !== ProviderList.GOOGLE) {
        throw new ConflictException(CONFLICT_ACCOUNT_MESSAGE);
      }

      return exUser;
    } catch (err) {
      handleError(err);
    }
  }
}