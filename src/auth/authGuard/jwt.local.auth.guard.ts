import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtLoginAuthGuard extends AuthGuard('jwt-local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return await super.canActivate(context) as boolean;
  }
}