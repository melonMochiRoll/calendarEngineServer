import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { OAUTH2_CSRF_STATE_COOKIE_NAME } from "src/common/constant/auth.constants";
import { INTERNAL_SERVER_MESSAGE } from "src/common/constant/error.message";
import { RedirectingException } from "src/common/exception/redirecting.exception";
import { getOrigin } from "src/common/function/getOrigin";

@Injectable()
export class OAuth2CSRFGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const queryState = request.query?.state;
    const oauth2CsrfToken = request.cookies[OAUTH2_CSRF_STATE_COOKIE_NAME];

    if (!queryState || !oauth2CsrfToken || queryState !== oauth2CsrfToken) {
      throw new RedirectingException(`${getOrigin()}/login?error=${INTERNAL_SERVER_MESSAGE}`);
    }

    response.clearCookie(OAUTH2_CSRF_STATE_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return true;
  }
} 