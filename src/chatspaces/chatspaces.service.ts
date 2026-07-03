import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { nanoid } from "nanoid";
import { SHAREDSPACE_ROLE, SPACE_TYPE, SPACE_URL_LENGTH, USER_STATUS } from "src/common/constant/constants";
import { ACCESS_DENIED_MESSAGE } from "src/common/constant/error.message";
import { ChatSpaces } from "src/entities/ChatSpaces";
import { SpaceMembers } from "src/entities/SpaceMembers";
import { Spaces } from "src/entities/Spaces";
import { RolesService } from "src/roles/roles.service";
import { DataSource, IsNull, LessThan, Repository } from "typeorm";
import { uuidv7 } from "uuidv7";
import { CreatChatspaceDTO } from "./dto/create.chatspace.dto";
import { SharedspaceFetcher } from "src/sharedspaces/sharedspaces.fetcher";

@Injectable()
export class ChatspacesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(SpaceMembers)
    private spaceMembersRepository: Repository<SpaceMembers>,
    private rolesService: RolesService,
    private sharedspaceFetcher: SharedspaceFetcher,
  ) {}

  async getChatspaceMembers(
    url: string,
    beforeUserId?: string,
    UserId?: string,
    limit = 10,
  ) {
    const space = await this.sharedspaceFetcher.getSpaceByUrl(url);

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
            path: true,
          },
        },
        Role: {
          name: true,
        },
      },
      where: beforeUserId ? {
        SpaceId: space.id,
        id: LessThan(beforeUserId),
        removedAt: IsNull(),
        User: {
          status: USER_STATUS.ACTIVE,
        },
      } : {
        SpaceId: space.id,
        removedAt: IsNull(),
        User: {
          status: USER_STATUS.ACTIVE,
        },
      },
      relations: {
        User: {
          ProfileImage: true,
        },
        Role: true,
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit + 1,
    });

    const hasMoreData = memberRecords.length > limit;

    if (hasMoreData) {
      memberRecords.pop();
    }

    const members = memberRecords.map((member) => {
      const { User, Role, ...rest } = member;
      return {
        ...rest,
        email: User.email,
        nickname: User.nickname,
        RoleName: Role.name,
        ProfileImage: User.ProfileImage?.path,
      };
    });

    if (beforeUserId) {
      return {
        members,
        memberCount: null,
        hasMoreData,
      };
    }

    const memberCount = await this.spaceMembersRepository.count({
      where: {
        SpaceId: space.id,
        removedAt: IsNull(),
        User: {
          status: USER_STATUS.ACTIVE,
        },
      },
    });

    return {
      members,
      memberCount,
      hasMoreData,
    };
  }

  async createChatSpace(
    UserId: string,
    dto: CreatChatspaceDTO,
  ) {
    const { targetUserId } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const SpaceId = uuidv7();
      const url = nanoid(SPACE_URL_LENGTH);

      await qr.manager.insert(Spaces, {
        id: SpaceId,
        url,
        type: SPACE_TYPE.CHAT,
      });
      await qr.manager.insert(ChatSpaces, { id: SpaceId });

      const memberInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.MEMBER);
      
      await qr.manager.insert(SpaceMembers, {
        id: uuidv7(),
        UserId,
        SpaceId,
        RoleId: memberInfo.id,
      });

      await qr.manager.insert(SpaceMembers, {
        id: uuidv7(),
        UserId: targetUserId,
        SpaceId,
        RoleId: memberInfo.id,
      });

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }
}