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
import { REFRESH_TOKEN_COOKIE_NAME } from "src/common/constant/auth.constants";

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
    const { accessToken, refreshToken } = await this.authService.jwtLogin(user.id);

    res.cookie(
      accessToken.name,
      accessToken.token, 
      accessToken.option,
    );
    res.cookie(
      refreshToken.name,
      refreshToken.token, 
      refreshToken.option,
    );

    res.status(201).send(user);
  }

  @UseGuards(IsNotJwtAuthenicatedGuard)
  @Get('login/oauth2/google')
  async loginOAuth2Google(@Res() res: Response) {
    const { name, value, option, url } = await this.authService.getGoogleAuthorizationUrl();

    res
      .cookie(name, value, option)
      .json(url);
  }

  @Redirect(getOrigin())
  @UseGuards(OAuth2CSRFGuard, GoogleAuthGuard)
  @Get('login/oauth2/google/callback')
  async loginOAuth2GoogleCallback(
    @Res() res: Response,
    @User() user: Users,
  ) {
    const { accessToken, refreshToken } = await this.authService.jwtLogin(user.id);

    res.cookie(
      accessToken.name,
      accessToken.token, 
      accessToken.option,
    );
    res.cookie(
      refreshToken.name,
      refreshToken.token, 
      refreshToken.option,
    );

    res.status(201).send(user);
  }

  @UseGuards(IsNotJwtAuthenicatedGuard)
  @Get('login/oauth2/naver')
  async loginOAuth2Naver(@Res() res: Response) {
    const { name, value, option, url } = await this.authService.getNaverAuthorizationUrl(res);

    res
      .cookie(name, value, option)
      .json(url);
  }

  @Redirect(getOrigin())
  @UseGuards(OAuth2CSRFGuard, NaverAuthGuard)
  @Get('login/oauth2/naver/callback')
  async loginOAuth2NaverCallback(
    @Res() res: Response,
    @User() user: Users,
  ) {
    const { accessToken, refreshToken } = await this.authService.jwtLogin(user.id);

    res.cookie(
      accessToken.name,
      accessToken.token, 
      accessToken.option,
    );
    res.cookie(
      refreshToken.name,
      refreshToken.token, 
      refreshToken.option,
    );

    res.status(201).send(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res() res: Response, @User() user: Users) {
    const clearCookies = await this.authService.logout(user.id);

    clearCookies.forEach(({name, option}) => {
      res.clearCookie(name, option);
    });

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
  async refreshAuthToken(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const refreshToken = req?.cookies[REFRESH_TOKEN_COOKIE_NAME];
    const {
      accessToken,
      refreshToken: newRefreshToken,
    } = await this.authService.refreshAuthToken(refreshToken);

    res.cookie(
      accessToken.name,
      accessToken.token, 
      accessToken.option,
    );
    res.cookie(
      newRefreshToken.name,
      newRefreshToken.token, 
      newRefreshToken.option,
    );

    res.send('ok');
  }
}