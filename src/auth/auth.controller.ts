import { Controller, Get, InternalServerErrorException, Post, Redirect, Res, UseGuards } from "@nestjs/common";
import { LocalAuthGuard } from "./authGuard/local.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { Response } from "express";
import { NaverAuthGuard } from "./authGuard/naver.auth.guard";
import { GoogleAuthGuard } from "./authGuard/google.auth.guard";
import { AuthService } from "./auth.service";
import { OAuth2CSRFGuard } from "./authGuard/oauth2.csrf.guard";
import { JwtLoginAuthGuard } from "./authGuard/jwt.local.auth.guard";
import { IsNotJwtAuthenicatedGuard, JwtAuthGuard } from "./authGuard/jwt.auth.guard";

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@User() user: Users) {
    return user;
  }

  @UseGuards(JwtLoginAuthGuard)
  @Post('login/jwt')
  jwtLogin(@User() user: Users) {
    return user;
  }

  @UseGuards(IsNotJwtAuthenicatedGuard)
  @Get('login/oauth2/google')
  loginOAuth2Google() {
    return this.authService.getGoogleAuthorizationUrl();
  }

  @Redirect(`${process.env.SERVER_ORIGIN}`)
  @UseGuards(OAuth2CSRFGuard, GoogleAuthGuard)
  @Get('login/oauth2/google/callback')
  loginOAuth2GoogleCallback(@User() user: Users) {
    return user;
  }

  @UseGuards(IsNotJwtAuthenicatedGuard)
  @Get('login/oauth2/naver')
  loginOAuth2Naver() {
    return this.authService.getNaverAuthorizationUrl();
  }

  @Redirect(`${process.env.SERVER_ORIGIN}`)
  @UseGuards(OAuth2CSRFGuard, NaverAuthGuard)
  @Get('login/oauth2/naver/callback')
  loginOAuth2NaverCallback(@User() user: Users) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Res() res: Response, @User() user: Users) {
    return this.authService.logout(res, user);
  };
}