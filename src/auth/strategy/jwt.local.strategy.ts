import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
import { INCORRECT_CREDENTIALS_MESSAGE, NOT_FOUND_USER } from "src/common/constant/error.message";
import { UserStatus } from "src/common/constant/constants";

@Injectable()
export class JwtLocalStrategy extends PassportStrategy(Strategy, 'jwt-local') {
  constructor(
    private authService: AuthService,
  ) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(
    email: string,
    password: string,
  ) {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException(INCORRECT_CREDENTIALS_MESSAGE);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(NOT_FOUND_USER);
    }

    return user;
  }
}