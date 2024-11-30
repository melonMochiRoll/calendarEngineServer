import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { INTERNAL_SERVER_MESSAGE } from "src/common/constant/error.message";
import { RedirectingException } from "src/common/exception/redirecting.exception";

@Injectable()
export class OAuth2CSRFGuard implements CanActivate {

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const state = request.session['state'];
    const providedState = request.query?.state;

    if (state !== providedState) {
      throw new RedirectingException(`${process.env.CLIENT_ORIGIN}/login?error=${INTERNAL_SERVER_MESSAGE}`);
    }

    return true;
  }
} 