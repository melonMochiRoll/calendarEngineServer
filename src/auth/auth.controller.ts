import { Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { IsAuthenicatedGuard, LocalAuthGuard } from "./local.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { Request, Response } from "express";
import { CacheManagerService } from "src/cacheManager/cacheManager.service";
import { NaverAuthGuard } from "./naver.auth.guard";
import { GoogleAuthGuard } from "./authGuard/google.auth.guard";

@Controller('api/auth')
export class AuthController {
  constructor(
    private cacheManagerService: CacheManagerService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@User() user: Users) {
    return user;
  }

  @UseGuards(GoogleAuthGuard)
  @Post('login/oauth2/google')
  loginOAuth2Google(@User() user: Users) {
    return user;
  }

  @UseGuards(NaverAuthGuard)
  @Post('login/oauth2/naver')
  loginOAuth2Naver(@User() user: Users) {
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