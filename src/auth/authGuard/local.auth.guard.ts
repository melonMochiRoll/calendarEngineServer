import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ACCESS_DENIED_MESSAGE, UNAUTHORIZED_MESSAGE } from "src/common/constant/error.message";

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = await super.canActivate(context) as boolean;
    
    if (result) {
      const request = context.switchToHttp().getRequest();
      await super.logIn(request);
    }

    return result;
  }
}

@Injectable()
export class IsAuthenicatedGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (!request.isAuthenticated()) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }
    
    return true;
  }
}

@Injectable()
export class IsNotAuthenicatedGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (request.isAuthenticated()) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    return true;
  }
}