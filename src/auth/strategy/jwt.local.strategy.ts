import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
import { INCORRECT_CREDENTIALS_MESSAGE } from "src/common/constant/error.message";

@Injectable()
export class JwtLocalStrategy extends PassportStrategy(Strategy, 'jwt-local') {
  constructor(
    private authService: AuthService,
  ) {
    super({ userNameField: 'email', passwordField: 'password' });
  }

  async validate(
    email: string,
    password: string,
  ) {
    const user = await this.authService.jwtValidateUser(email, password);

    if (!user) {
      throw new UnauthorizedException(INCORRECT_CREDENTIALS_MESSAGE);
    }

    return user;
  }
}