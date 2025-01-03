import { Controller, Get, Post, Redirect, Req, Res, UseGuards } from "@nestjs/common";
import { IsAuthenicatedGuard, LocalAuthGuard } from "./authGuard/local.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { Request, Response } from "express";
import { CacheManagerService } from "src/cacheManager/cacheManager.service";
import { NaverAuthGuard } from "./authGuard/naver.auth.guard";
import { GoogleAuthGuard } from "./authGuard/google.auth.guard";
import { AuthService } from "./auth.service";
import { OAuth2CSRFGuard } from "./authGuard/oauth2.csrf.guard";

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cacheManagerService: CacheManagerService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@User() user: Users) {
    return user;
  }

  @Get('login/oauth2/google')
  loginOAuth2Google() {
    return this.authService.getGoogleAuthorizationUrl();
  }

  @Redirect(`${process.env.CLIENT_ORIGIN}`)
  @UseGuards(OAuth2CSRFGuard, GoogleAuthGuard)
  @Get('login/oauth2/google/callback')
  loginOAuth2GoogleCallback(@User() user: Users) {
    return user;
  }

  
  @Get('login/oauth2/naver')
  loginOAuth2Naver() {
    return this.authService.getNaverAuthorizationUrl();
  }

  @Redirect(`${process.env.CLIENT_ORIGIN}`)
  @UseGuards(OAuth2CSRFGuard, NaverAuthGuard)
  @Get('login/oauth2/naver/callback')
  loginOAuth2NaverCallback(@User() user: Users) {
    return user;
  }

  @UseGuards(IsAuthenicatedGuard)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res() res: Response,
    @User() user: Users,
  ) {
    try {
      await this.cacheManagerService.clearUserCache(user.id);

      req.logOut((err) => {
        if (err) console.error(err);
      });
      res.clearCookie('connect.sid', { httpOnly: true });
      res.status(200).send('logout');
    } catch (err) {
      res.status(500).send('error');
    }
  };
}