import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { USER_STATUS } from "src/common/constant/constants";
import { ACCESS_DENIED_MESSAGE } from "src/common/constant/error.message";
import { SpaceMembers } from "src/entities/SpaceMembers";
import { RolesService } from "src/roles/roles.service";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { IsNull, Repository } from "typeorm";

@Injectable()
export class ChatspacesService {
  constructor(
    @InjectRepository(SpaceMembers)
    private spaceMembersRepository: Repository<SpaceMembers>,
    private rolesService: RolesService,
    private sharedspacesService: SharedspacesService,
  ) {}

  async getChatspaceMembers(
    url: string,
    page = 1,
    UserId?: string,
    limit = 10,
  ) {
    const space = await this.sharedspacesService.getSpaceByUrl(url);

    const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

    if (!isParticipant) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const memberRecords = await this.spaceMembersRepository.find({
      select: {
        id: true,
        UserId: true,
        SpaceId: true,
        createdAt: true,
        User: {
          email: true,
          nickname: true,
          ProfileImage: {
            id: true,
            Image: {
              path: true,
            },
          },
        },
        Role: {
          name: true,
        },
      },
      where: {
        SpaceId: space.id,
        removedAt: IsNull(),
        User: {
          status: USER_STATUS.ACTIVE,
        },
      },
      relations: {
        User: {
          ProfileImage: {
            Image: true,
          },
        },
        Role: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const members = memberRecords.map((member) => {
      const { User, Role, ...rest } = member;
      return {
        ...rest,
        email: User.email,
        nickname: User.nickname,
        RoleName: Role.name,
        ProfileImage: User.ProfileImage?.Image?.path,
      };
    });

    const totalCount = await this.spaceMembersRepository.count({
      where: {
        SpaceId: space.id,
        removedAt: IsNull(),
        User: {
          status: USER_STATUS.ACTIVE,
        },
      },
    });

    return {
      items: members,
      memberCount: totalCount,
      hasMoreData: !Boolean(page * limit >= totalCount),
    };
  }
}