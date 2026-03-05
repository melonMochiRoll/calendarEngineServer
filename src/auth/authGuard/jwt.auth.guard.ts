import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ACCESS_DENIED_MESSAGE, TOKEN_EXPIRED } from "src/common/constant/error.message";
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "src/common/constant/auth.constants";
import { Users } from "src/entities/Users";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.res = context.switchToHttp().getResponse();

    return await super.canActivate(context) as boolean;
  }

  handleRequest<TUser = Users>(err: any, user: TUser | null) {
    if (err) {
      throw new UnauthorizedException(TOKEN_EXPIRED);
    }
    return user;
  }
}

export class PublicAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.res = context.switchToHttp().getResponse();

    return await super.canActivate(context) as boolean;
  }

  handleRequest<TUser = Users>(err: any, user: TUser | null) {
    return user;
  }
}

@Injectable()
export class IsNotJwtAuthenicatedGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    return await super.canActivate(context) as boolean;
  }

  handleRequest<TUser = Users>(err: any, user: TUser | null) {
    if (user) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }
    return null;
  }
}