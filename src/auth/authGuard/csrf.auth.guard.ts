import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { CSRF_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER_NAME } from "src/common/constant/auth.constants";
import { TOKEN_EXPIRED } from "src/common/constant/error.message";

@Injectable()
export class CSRFAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const cookieToken = request.cookies[CSRF_TOKEN_COOKIE_NAME];
    const headerToken = request.headers[CSRF_TOKEN_HEADER_NAME];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException(TOKEN_EXPIRED);                             
    }

    return true;
  }
}