import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorator/roles.decorator';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { ACCESS_DENIED_MESSAGE } from '../constant/errorMessages';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.get(Roles, context.getHandler());
    
    if (!roles) {
      return true;
    }

    const userSpaces = context.switchToHttp().getRequest().user['Sharedspacemembers'];
    const spaceId = context.switchToHttp().getRequest().body['SharedspaceId'];

    const userRoles = userSpaces
      .filter((item: SharedspaceMembers) => item.SharedspaceId === spaceId)
      .map((item: SharedspaceMembers) => item?.role || '');

    if (!matchRoles(roles, userRoles)) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    return true;
  }
}

const matchRoles = (roles: string[], userRoles: string[]) => {
  return roles.reduce((acc: boolean, role: string) => {
    if (!acc && userRoles.includes(role)) {
      return true;
    } else {
      return acc;
    }
  }, false);
};