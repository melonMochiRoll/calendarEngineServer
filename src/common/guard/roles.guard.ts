import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorator/roles.decorator';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE } from '../constant/error.message';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharedspacesService } from 'src/sharedspaces/sharedspaces.service';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private sharedspacesService: SharedspacesService,
    private rolesService: RolesService,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembersRepository: Repository<SharedspaceMembers>,
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

    const space = await this.sharedspacesService.findOne(user.id, url);

    if (!space) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const userRole = await this.sharedspaceMembersRepository.findOne({
      select: {
        SharedspaceId: true,
        RoleId: true,
      },
      where: {
        UserId: user?.id,
        SharedspaceId: space?.id,
      },
    });

    const roleIdMap = await this.rolesService.getRoleMap();
    const roleIds = roles.map((role) => roleIdMap[role]);

    return roleIds.includes(userRole.RoleId);
  }
}