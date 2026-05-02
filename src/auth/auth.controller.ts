import { Controller, Get, Post, Redirect, Req, Res, UseGuards } from "@nestjs/common";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { Request, Response } from "express";
import { NaverAuthGuard } from "./authGuard/naver.auth.guard";
import { GoogleAuthGuard } from "./authGuard/google.auth.guard";
import { AuthService } from "./auth.service";
import { OAuth2CSRFGuard } from "./authGuard/oauth2.csrf.guard";
import { JwtLoginAuthGuard } from "./authGuard/jwt.local.auth.guard";
import { IsNotJwtAuthenicatedGuard, JwtAuthGuard, PublicAuthGuard } from "./authGuard/jwt.auth.guard";
import { getOrigin } from "src/common/function/getOrigin";

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  @UseGuards(JwtLoginAuthGuard)
  @Post('login/jwt')
  async jwtLogin(
    @Res() res: Response,
    @User() user: Users,
  ) {
    await this.authService.jwtLogin(res, user.id);

    res.status(201).send(user);
  }

  @UseGuards(IsNotJwtAuthenicatedGuard)
  @Get('login/oauth2/google')
  loginOAuth2Google(@Res() res: Response) {
    this.authService.getGoogleAuthorizationUrl(res);
  }

  @Redirect(getOrigin())
  @UseGuards(OAuth2CSRFGuard, GoogleAuthGuard)
  @Get('login/oauth2/google/callback')
  async loginOAuth2GoogleCallback(
    @Res() res: Response,
    @User() user: Users,
  ) {
    await this.authService.jwtLogin(res, user.id);

    res.status(201).send(user);
  }

  @UseGuards(IsNotJwtAuthenicatedGuard)
  @Get('login/oauth2/naver')
  loginOAuth2Naver(@Res() res: Response) {
    this.authService.getNaverAuthorizationUrl(res);
  }

  @Redirect(getOrigin())
  @UseGuards(OAuth2CSRFGuard, NaverAuthGuard)
  @Get('login/oauth2/naver/callback')
  async loginOAuth2NaverCallback(
    @Res() res: Response,
    @User() user: Users,
  ) {
    await this.authService.jwtLogin(res, user.id);

    res.status(201).send(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res() res: Response, @User() user: Users) {
    await this.authService.logout(res, user);

    res.send('ok');
  }

  @UseGuards(PublicAuthGuard)
  @Get('csrf-token')
  getCsrfToken(@Res() res: Response) {
    const { name, csrfToken, option } = this.authService.getCsrfToken();

    res.cookie(
      name,
      csrfToken,
      option
    )
    .json({ csrfToken });
  }

  @UseGuards(IsNotJwtAuthenicatedGuard)
  @Post('refresh')
  refreshAuthToken(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.authService.refreshAuthToken(req, res);
  }
}