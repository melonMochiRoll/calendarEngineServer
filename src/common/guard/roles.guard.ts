import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorator/roles.decorator';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { ACCESS_DENIED_MESSAGE } from '../constant/error.message';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.get(Roles, context.getHandler());
    
    if (!roles) {
      return true;
    }

    const method = context.switchToHttp().getRequest().method;
    const bodyIncludesMethods = ['POST', 'PUT', 'PATCH'];

    const userSpaces = context.switchToHttp().getRequest().user['Sharedspacemembers'];

    const sharedspaceId =
      bodyIncludesMethods.includes(method) ?
        Number(context.switchToHttp().getRequest().body['SharedspaceId']) :
        Number(context.switchToHttp().getRequest().params['SharedspaceId']);

    const userRoles = userSpaces
      .filter((item: SharedspaceMembers) => item.SharedspaceId === sharedspaceId)
      .map((item: SharedspaceMembers) => item?.role || '');

    if (!this.matchRoles(roles, userRoles)) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    return true;
  }

  private matchRoles = (roles: string[], userRoles: string[]) => {
    return roles.reduce((acc: boolean, role: string) => {
      if (!acc && userRoles.includes(role)) {
        return true;
      } else {
        return acc;
      }
    }, false);
  }
}