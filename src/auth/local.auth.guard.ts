import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

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

    if (request.isAuthenticated()) {
      return true;
    }

    throw new UnauthorizedException();
  }
}

@Injectable()
export class IsNotAuthenicatedGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return !request.isAuthenticated();
  }
}