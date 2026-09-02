import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { nanoid } from "nanoid";
import { CACHE_EMPTY_SYMBOL, CHATROOM_TYPE, USER_STATUS } from "src/common/constant/constants";
import { ACCESS_DENIED_MESSAGE } from "src/common/constant/error.message";
import { ChatRooms } from "src/entities/ChatRooms";
import { DataSource, IsNull, LessThan, Repository } from "typeorm";
import { uuidv7 } from "uuidv7";
import { CreateDmChatRoomDTO } from "./dto/create.dm.chatroom.dto";
import { RoomParticipants } from "src/entities/RoomParticipants";
import { ChatRoomsFetcher } from "./chatrooms.fetcher";
import { SharedspaceChatRooms } from "src/entities/SharedspaceChatRooms";
import { DmChatRooms } from "src/entities/DmChatRooms";
import { CreateSharedspaceChatRoomDTO } from "./dto/create.sharedspace.chatroom.dto";
import { RolesService } from "src/roles/roles.service";
import { SharedspaceFetcher } from "src/sharedspaces/sharedspaces.fetcher";
import { UpdateSharedspaceChatRoomNameDTO } from "./dto/update.sharedspace.chatroom.name.dto";
import dayjs from "dayjs";
import { InviteDmChatRoomDTO } from "./dto/invite.dm.chatroom";
import { stringToUUID, uuidToString } from "src/common/function/utilFunctions";
import { RedisClientService } from "src/redisClient/redisClient.service";

@Injectable()
export class ChatRoomsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ChatRooms)
    private chatRoomsRepository: Repository<ChatRooms>,
    @InjectRepository(SharedspaceChatRooms)
    private sharedspaceChatRoomsRepository: Repository<SharedspaceChatRooms>,
    @InjectRepository(RoomParticipants)
    private roomParticipantsRepository: Repository<RoomParticipants>,
    private rolesService: RolesService,
    private redisClientService: RedisClientService,
    private chatRoomsFetcher: ChatRoomsFetcher,
    private sharedspaceFetcher: SharedspaceFetcher,
  ) {}

  async getChatRoomParticipants(
    RoomId: string,
    UserId: string,
    beforeParticipantId?: string,
    limit = 10,
  ) {
    const isParticipant = await this.chatRoomsFetcher.isParticipant(UserId, RoomId);

    if (!isParticipant) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const participantRecords = await this.roomParticipantsRepository.find({
      select: {
        id: true,
        UserId: true,
        RoomId: true,
        createdAt: true,
        User: {
          email: true,
          nickname: true,
          ProfileImage: {
            id: true,
            path: true,
          },
        },
      },
      where: beforeParticipantId ? {
        RoomId,
        id: LessThan(beforeParticipantId),
        removedAt: IsNull(),
        User: {
          status: USER_STATUS.ACTIVE,
        },
      } : {
        RoomId,
        removedAt: IsNull(),
        User: {
          status: USER_STATUS.ACTIVE,
        },
      },
      relations: {
        User: {
          ProfileImage: true,
        },
      },
      order: {
        id: 'DESC',
      },
      take: limit + 1,
    });

    const hasMoreData = participantRecords.length > limit;

    if (hasMoreData) {
      participantRecords.pop();
    }

    const members = participantRecords.map((member) => {
      const { User, ...rest } = member;
      return {
        ...rest,
        email: User.email,
        nickname: User.nickname,
        ProfileImage: User.ProfileImage?.path,
      };
    });

    if (beforeParticipantId) {
      return {
        members,
        memberCount: null,
        hasMoreData,
      };
    }

    const memberCount = await this.roomParticipantsRepository.count({
      where: {
        RoomId,
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

  async createDmChatRoom(
    UserId: string,
    dto: CreateDmChatRoomDTO,
  ) {
    const { targetUserId } = dto;

    const cacheKey = `roomParticipants:oneOnOne:${UserId}:${targetUserId}`;

    const cachedItem = await this.redisClientService.get<{ ChatRoomId: string }>(cacheKey);

    if (cachedItem) {
      return { ChatRoomId: cachedItem.ChatRoomId };
    }

    const userIds = [ UserId, targetUserId ].map(id => stringToUUID(id));

    const oneOnOneChatRoom = await this.roomParticipantsRepository
      .createQueryBuilder('roomParticipants')
      .select([
        'roomParticipants.RoomId AS RoomId',
        'COUNT(roomParticipants.UserId) AS UserCount',
      ])
      .where('UserId IN (:...userIds)', { userIds })
      .groupBy('RoomId')
      .having('UserCount = :cnt', { cnt: userIds.length })
      .getRawOne<{ RoomId: Buffer, UserCount: string }>();

    const minute = 60000;

    if (oneOnOneChatRoom) {
      const result = { ChatRoomId: uuidToString(oneOnOneChatRoom.RoomId) };

      await this.redisClientService.set(cacheKey, result, 5 * minute);
      return result;
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const RoomId = uuidv7();

      await qr.manager.upsert(ChatRooms, {
        id: RoomId,
        type: CHATROOM_TYPE.DM,
      }, ['id']);

      await qr.manager.upsert(DmChatRooms, {
        id: RoomId,
        lastMessageAt: dayjs().toDate(),
      }, ['id']);

      await qr.manager.upsert(RoomParticipants, {
        id: uuidv7(),
        UserId,
        RoomId,
      }, ['UserId', 'RoomId']);

      await qr.manager.upsert(RoomParticipants, {
        id: uuidv7(),
        UserId: targetUserId,
        RoomId,
      }, ['UserId', 'RoomId']);

      await qr.commitTransaction();

      await this.redisClientService.set(cacheKey, { ChatRoomId: RoomId }, 5 * minute);

      return { ChatRoomId: RoomId };
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async createSharedspaceChatRoom(
    SharedspaceId: string,
    dto: CreateSharedspaceChatRoomDTO,
    UserId: string,
  ) {
    const { name } = dto;

    const isOwner = await this.rolesService.requireOwner(UserId, SharedspaceId);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const RoomId = uuidv7();

      await qr.manager.insert(ChatRooms, {
        id: RoomId,
        type: CHATROOM_TYPE.SPACE,
      });

      await qr.manager.insert(SharedspaceChatRooms, {
        id: RoomId,
        name,
        SharedspaceId,
      });

      await qr.commitTransaction();

      await this.sharedspaceFetcher.fetchSharedspaceAndWrite(`sharedspace:${SharedspaceId}`, SharedspaceId);
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async updateSharedspaceChatRoomName(
    SharedspaceId: string,
    ChatRoomId: string,
    dto: UpdateSharedspaceChatRoomNameDTO,
    UserId: string,
  ) {
    const { name } = dto;

    const isOwner = await this.rolesService.requireOwner(UserId, SharedspaceId);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    await this.sharedspaceChatRoomsRepository.update({
      id: ChatRoomId,
      SharedspaceId,
    }, {
      name,
    });

    await this.sharedspaceFetcher.fetchSharedspaceAndWrite(`sharedspace:${SharedspaceId}`, SharedspaceId);
  }

  async deleteSharedspaceChatRoom(
    SharedspaceId: string,
    ChatRoomId: string,
    UserId: string,
  ) {
    const isOwner = await this.rolesService.requireOwner(UserId, SharedspaceId);

    if (!isOwner) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    await this.chatRoomsRepository.update({
      id: ChatRoomId,
      type: CHATROOM_TYPE.SPACE,
    }, {
      removedAt: dayjs().toDate(),
    });

    await this.sharedspaceFetcher.fetchSharedspaceAndWrite(`sharedspace:${SharedspaceId}`, SharedspaceId);
  }

  async inviteDmChatRoom(
    ChatRoomId: string,
    dto: InviteDmChatRoomDTO,
    UserId: string,
  ) {
    const { targetUserIds } = dto;

    const isParticipant = await this.chatRoomsFetcher.isParticipant(UserId, ChatRoomId);

    if (!isParticipant) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const entities = targetUserIds.map(targetUserId => {
      return {
        UserId: targetUserId,
        RoomId: ChatRoomId,
      };
    });

    await this.roomParticipantsRepository.insert(entities);
  }

  async leaveDmChatRoom(
    ChatRoomId: string,
    UserId: string,
  ) {
    await this.roomParticipantsRepository.delete({
      UserId,
      RoomId: ChatRoomId,
    });
  }
}