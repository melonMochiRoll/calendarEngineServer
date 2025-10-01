import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, NOT_FOUND_SPACE_MESSAGE, UNAUTHORIZED_MESSAGE } from '../constant/error.message';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { TUserData } from 'src/typings/types';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';

@Injectable()
export class PublicSpaceGuard implements CanActivate {
  constructor(
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembersRepository: Repository<SharedspaceMembers>,
  ) {}
  
  async canActivate(context: ExecutionContext) {
    const url: string = context.switchToHttp().getRequest().params.url;

    if (!url) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const space = await this.sharedspacesRepository.findOneBy({ url });

    if (!space) {
      throw new NotFoundException(NOT_FOUND_SPACE_MESSAGE);
    }

    if (!space.private) {
      return true;
    }

    const user: TUserData = context.switchToHttp().getRequest().user;

    if (!user) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    const userRole = await this.sharedspaceMembersRepository.findOne({
      select: {
        SharedspaceId: true,
        RoleId: true,
      },
      where: {
        UserId: user.id,
        SharedspaceId: space.id,
      },
    });

    if (!userRole) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    return true;
  }
}