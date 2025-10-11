import { ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ACCESS_DENIED_MESSAGE } from "src/common/constant/error.message";
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "src/common/constant/auth.constants";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.res = context.switchToHttp().getResponse();

    return await super.canActivate(context) as boolean;
  }
}

@Injectable()
export class IsNotJwtAuthenicatedGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const accessToken = request.cookies[ACCESS_TOKEN_COOKIE_NAME];
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (accessToken && refreshToken) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }
    
    return true;
  }
}