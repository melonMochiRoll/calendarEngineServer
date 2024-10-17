import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, NOT_FOUND_SPACE_MESSAGE } from '../constant/error.message';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { Users } from 'src/entities/Users';
import { SharedspaceMembersRoles } from 'src/typings/types';

@Injectable()
export class PublicSpaceGuard implements CanActivate {
  constructor(
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
  ) {}
  
  async canActivate(context: ExecutionContext) { // TODO: URL로 스페이스에 접근 -> 해당 스페이스의 비공개 여부 확인 -> 비공개 ? viewer 이상인지 확인 : 전부 true
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

    const user: Users = context.switchToHttp().getRequest().user;

    if (!user) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const isMember = user.Sharedspacemembers
      .filter((space) => space.SharedspaceId === targetSpace.id)
      .some((space) => Object.values(SharedspaceMembersRoles).includes(space.role as any));

    if (!isMember) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    return true;
  }
}