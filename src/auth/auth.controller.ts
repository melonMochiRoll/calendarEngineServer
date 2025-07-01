import { Controller, Get, Post, Redirect, Res, UseGuards } from "@nestjs/common";
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
  async jwtLogin(
    @Res() res: Response,
    @User() user: Users,
  ) {
    await this.authService.jwtLogin(res, user.email, user.id);

    res.status(201).send(user);
  }

  @UseGuards(IsNotJwtAuthenicatedGuard)
  @Get('login/oauth2/google')
  loginOAuth2Google() {
    return this.authService.getGoogleAuthorizationUrl();
  }

  @Redirect(`${process.env.SERVER_ORIGIN}`)
  @UseGuards(OAuth2CSRFGuard, GoogleAuthGuard)
  @Get('login/oauth2/google/callback')
  async loginOAuth2GoogleCallback(
    @Res() res: Response,
    @User() user: Users,
  ) {
    await this.authService.jwtLogin(res, user.email, user.id);

    res.status(201).send(user);
  }

  @UseGuards(IsNotJwtAuthenicatedGuard)
  @Get('login/oauth2/naver')
  loginOAuth2Naver() {
    return this.authService.getNaverAuthorizationUrl();
  }

  @Redirect(`${process.env.SERVER_ORIGIN}`)
  @UseGuards(OAuth2CSRFGuard, NaverAuthGuard)
  @Get('login/oauth2/naver/callback')
  async loginOAuth2NaverCallback(
    @Res() res: Response,
    @User() user: Users,
  ) {
    await this.authService.jwtLogin(res, user.email, user.id);

    res.status(201).send(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res() res: Response, @User() user: Users) {
    await this.authService.logout(res, user);

    res.send('ok');
  }

  @UseGuards(JwtAuthGuard)
  @Get('csrf-token')
  getCsrfToken(@Res() res: Response) {
    this.authService.getCsrfToken(res);

    res.send('ok');
  }
}