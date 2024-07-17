import { Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { IsAuthenicatedGuard, LocalAuthGuard } from "./local.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { Request, Response } from "express";

@Controller('api/auth')
export class AuthController {
  constructor() {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@User() user: Users) {
    return user;
  };

  @UseGuards(IsAuthenicatedGuard)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
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