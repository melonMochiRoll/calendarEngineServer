import { ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";
import { INTERNAL_SERVER_MESSAGE } from "src/common/constant/error.message";
import { RedirectingException } from "src/common/exception/redirecting.exception";
import { Users } from "src/entities/Users";
import dayjs from "dayjs";

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(
    private jwtService: JwtService,
  ) {
    super();
  }
  
  async canActivate(context: ExecutionContext) {
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

  handleRequest<TUser = Users>(err: Error | null, user: TUser | false, info: never, ctx: ExecutionContext) {
    if (err || !user) {
      console.error(err);
      throw new RedirectingException(`${process.env.SERVER_ORIGIN}/login?error=${INTERNAL_SERVER_MESSAGE}`);
    }

    return user;
  }
}