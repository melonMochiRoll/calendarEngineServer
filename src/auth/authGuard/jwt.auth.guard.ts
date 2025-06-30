import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ACCESS_DENIED_MESSAGE } from "src/common/constant/error.message";
import { AuthService } from "../auth.service";
import { ModuleRef } from "@nestjs/core";
import { Users } from "src/entities/Users";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private authService: AuthService;

  constructor (
    private moduleref: ModuleRef,
  ) {}

  async onModuleInit() {
    this.authService = await this.moduleref.get(AuthService, { strict: false });
  }

  async canActivate(context: ExecutionContext) {
    const response = context.switchToHttp().getResponse();

    try {
      return await new (AuthGuard('jwt'))().canActivate(context) as boolean;
    } catch (err) {
      const refresh = await new (AuthGuard('jwt-refresh'))().canActivate(context) as boolean;

      if (refresh) {
        const users: Users = context.switchToHttp().getRequest()?.user;

        await this.authService.jwtLogin(response, users.email, users.id);
      }

      return refresh;
    }
  }
}

@Injectable()
export class IsNotJwtAuthenicatedGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const result = await super.canActivate(context);

    if (result) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }
    
    return true;
  }
}