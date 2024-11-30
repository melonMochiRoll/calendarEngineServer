import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Users } from "src/entities/Users";

@Injectable()
export class NaverAuthGuard extends AuthGuard('naver') {
  async canActivate(context: ExecutionContext) {
    const result = await super.canActivate(context) as boolean;
    
    if (result) {
      const request = context.switchToHttp().getRequest();
      await super.logIn(request);
    }

    return result;
  }

  handleRequest<TUser = Users>(err: Error | null, user: TUser | false, info: never, ctx: ExecutionContext) {
    const res = ctx.switchToHttp().getResponse();

    if (err || !user) {
      console.error(err);
      return res.redirect(`${process.env.CLIENT_ORIGIN}/login`);
    }

    return user;
  }
}