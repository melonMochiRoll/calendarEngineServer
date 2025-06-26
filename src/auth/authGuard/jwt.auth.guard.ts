import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ACCESS_DENIED_MESSAGE, UNAUTHORIZED_MESSAGE } from "src/common/constant/error.message";
import { Users } from "src/entities/Users";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    return await super.canActivate(context) as boolean;
  }

  handleRequest<TUser = Users>(err: Error | null, user: TUser | false, info: never, ctx: ExecutionContext) {
    if (err || !user) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    return user;
  }
}

@Injectable()
export class IsNotJwtAuthenicatedGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const result = await super.canActivate(context);

    if (result) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }
    
    return true;
  }
}