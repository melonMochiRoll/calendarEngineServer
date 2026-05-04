import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ERROR_TYPE } from "src/common/constant/auth.constants";
import { ACCESS_DENIED_MESSAGE, TOKEN_EXPIRED } from "src/common/constant/error.message";
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

@Injectable()
export class PublicAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.res = context.switchToHttp().getResponse();

    return await super.canActivate(context) as boolean;
  }

  handleRequest<TUser = Users>(err: any, user: TUser | null) {
    if (err?.response?.metaData?.type === ERROR_TYPE.TOKEN_EXPIRED) {
      throw err;
    }

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