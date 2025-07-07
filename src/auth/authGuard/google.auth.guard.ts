import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { INTERNAL_SERVER_MESSAGE } from "src/common/constant/error.message";
import { RedirectingException } from "src/common/exception/redirecting.exception";
import { getOrigin } from "src/common/function/getOrigin";
import { Users } from "src/entities/Users";

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext) {
    return await super.canActivate(context) as boolean;
  }

  handleRequest<TUser = Users>(err: Error | null, user: TUser | false, info: never, ctx: ExecutionContext) {
    if (err || !user) {
      console.error(err);
      throw new RedirectingException(`${getOrigin()}/login?error=${INTERNAL_SERVER_MESSAGE}`);
    }

    return user;
  }
}