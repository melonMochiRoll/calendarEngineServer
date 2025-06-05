import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, NOT_FOUND_SPACE_MESSAGE, UNAUTHORIZED_MESSAGE } from '../constant/error.message';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspaceMembersRoles, TUserData } from 'src/typings/types';

@Injectable()
export class PublicSpaceGuard implements CanActivate {
  constructor(
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
  ) {}
  
  async canActivate(context: ExecutionContext) {
    const url: string = context.switchToHttp().getRequest().params.url;

    if (!url) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const targetSpace = await this.sharedspacesRepository.findOneBy({ url });

    if (!targetSpace) {
      throw new NotFoundException(NOT_FOUND_SPACE_MESSAGE);
    }

    if (!targetSpace.private) {
      return true;
    }

    const user: TUserData = context.switchToHttp().getRequest().user;

    if (!user) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    const isMember = user.Sharedspacemembers
      .filter((Sharedspacemember) => Sharedspacemember.Sharedspace.url === url)
      .some((space) => Object.values(SharedspaceMembersRoles).includes(space.Role.name as any));

    if (!isMember) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    return true;
  }
}