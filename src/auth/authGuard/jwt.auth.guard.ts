import { ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ERROR_TYPE } from "src/common/constant/auth.constants";
import { ACCESS_DENIED_MESSAGE } from "src/common/constant/error.message";
import { Users } from "src/entities/Users";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as boolean;
  }
}

@Injectable()
export class PublicAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as boolean;
  }

  handleRequest<TUser = Users>(err: any, user: TUser | null) {
    if (err?.response?.metaData?.type === ERROR_TYPE.TOKEN_EXPIRED) {
      throw err;
    }

    return user;
  }
}

@Injectable()
export class IsNotJwtAuthenicatedGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as boolean;
  }

  handleRequest<TUser = Users>(err: any, user: TUser | null) {
    if (user) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }
    return null;
  }
}