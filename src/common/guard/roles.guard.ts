import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorator/roles.decorator';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, NOT_FOUND_SPACE_MESSAGE } from '../constant/error.message';
import { Repository } from 'typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
  ) {}
  
  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.get(Roles, context.getHandler());
    
    if (!roles) {
      return true;
    }

    const userSpaces = context.switchToHttp().getRequest().user['Sharedspacemembers'];

    const url: string | null = context.switchToHttp().getRequest().params.url;

    if (!url) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const targetSpace = await this.sharedspacesRepository.findOneBy({ url });

    if (!targetSpace) {
      throw new NotFoundException(NOT_FOUND_SPACE_MESSAGE);
    }

    const userRoles = userSpaces
      .filter((item: SharedspaceMembers) => item.SharedspaceId === targetSpace.id)
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