import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorator/roles.decorator';
import { BAD_REQUEST_MESSAGE } from '../constant/error.message';
import { SharedspacesService } from 'src/sharedspaces/sharedspaces.service';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private sharedspacesService: SharedspacesService,
    private rolesService: RolesService,
  ) {}
  
  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.get(Roles, context.getHandler());
    
    if (!roles || !roles.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const url: string | null = context.switchToHttp().getRequest().params.url;

    if (!url) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    if (!space) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const userRole = await this.rolesService.getUserRole(user.id, space.id);

    const roleIdMap = await this.rolesService.getRoleMap();
    const roleIds = roles.map((role) => roleIdMap[role]);

    return roleIds.includes(userRole.RoleId);
  }
}