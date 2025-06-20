import { ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";
import dayjs from "dayjs";

@Injectable()
export class JwtLoginAuthGuard extends AuthGuard('jwt-local') {
  constructor(
    private jwtService: JwtService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = await super.canActivate(context) as boolean;

    if (result) {
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();
      const user = request?.user;
      const expires = dayjs().add(15, 'minute');

      const payload = {
        email: user.email,
        userId: user.id,
        exp: expires.unix(),
      };

      const token = this.jwtService.sign(payload);

      response.cookie('accessToken', token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        expires: expires.toDate(),
      });
    }

    return result;
  }
}