import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtLoginAuthGuard extends AuthGuard('jwt-local') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as boolean;
  }
}