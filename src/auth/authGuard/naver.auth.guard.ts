import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { INTERNAL_SERVER_MESSAGE } from "src/common/constant/error.message";
import { RedirectingException } from "src/common/exception/redirecting.exception";
import { getOrigin } from "src/common/function/utilFunctions";

@Injectable()
export class NaverAuthGuard extends AuthGuard('naver') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as boolean;
  }

  handleRequest<TUser = string>(err: Error | null, UserId: TUser | false, info: never, ctx: ExecutionContext) {
    if (err || !UserId) {
      console.error(err);
      throw new RedirectingException(`${getOrigin()}/login?error=${INTERNAL_SERVER_MESSAGE}`);
    }

    return UserId;
  }
}