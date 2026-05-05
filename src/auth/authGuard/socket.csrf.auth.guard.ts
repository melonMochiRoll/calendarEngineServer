import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { CSRF_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER_NAME } from "src/common/constant/auth.constants";
import { TOKEN_EXPIRED } from "src/common/constant/error.message";

@Injectable()
export class SocketCSRFAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const client = context.switchToWs().getClient();

    const cookieArray = client.handshake.headers.cookie
      .split('; ')
      .map((cookie: string) => cookie.split('='));
    const cookies = Object.fromEntries(cookieArray);

    const cookieToken = cookies[CSRF_TOKEN_COOKIE_NAME];
    const headerToken = client.handshake.auth[CSRF_TOKEN_HEADER_NAME];
    
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new UnauthorizedException(TOKEN_EXPIRED);
    }

    return true;
  }
}