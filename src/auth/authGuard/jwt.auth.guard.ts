import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ACCESS_DENIED_MESSAGE } from "src/common/constant/error.message";
import { AuthService } from "../auth.service";
import { ModuleRef } from "@nestjs/core";
import { Users } from "src/entities/Users";
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "src/common/constant/auth.constants";

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
      await new (AuthGuard('jwt'))().canActivate(context) as boolean;
    } catch (err) {
      await new (AuthGuard('jwt-refresh'))().canActivate(context) as boolean;

      const users: Users = context.switchToHttp().getRequest()?.user;

      await this.authService.jwtLogin(response, users.id);
    }

    return true;
  }
}

@Injectable()
export class IsNotJwtAuthenicatedGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const accessToken = request.cookies[ACCESS_TOKEN_COOKIE_NAME];
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE_NAME];

    if (accessToken && refreshToken) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }
    
    return true;
  }
}