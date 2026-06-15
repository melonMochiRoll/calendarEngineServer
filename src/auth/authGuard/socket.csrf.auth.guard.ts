import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { CSRF_TOKEN_COOKIE_NAME, CSRF_TOKEN_HEADER_NAME, ERROR_TYPE } from "src/common/constant/auth.constants";

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
      throw new WsException({
        type: ERROR_TYPE.UNAUTHORIZED_ERROR,
        message: 'CSRF 토큰 검증에 실패했습니다.',
      });
    }

    return true;
  }
}