import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { nanoid } from "nanoid";
import { CHATROOM_TYPE, USER_STATUS } from "src/common/constant/constants";
import { ACCESS_DENIED_MESSAGE } from "src/common/constant/error.message";
import { ChatRooms } from "src/entities/ChatRooms";
import { DataSource, IsNull, LessThan, Repository } from "typeorm";
import { uuidv7 } from "uuidv7";
import { CreateDmChatRoomDTO } from "./dto/create.dm.chatroom.dto";
import { RoomParticipants } from "src/entities/RoomParticipants";
import { ChatRoomsFetcher } from "./chatrooms.fetcher";
import { SharedspaceChatRooms } from "src/entities/SharedspaceChatRooms";

@Injectable()
export class ChatRoomsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ChatRooms)
    private chatRoomsRepository: Repository<ChatRooms>,
    @InjectRepository(RoomParticipants)
    private roomParticipantsRepository: Repository<RoomParticipants>,
    private chatRoomsFetcher: ChatRoomsFetcher,
  ) {}

  async getChatRoomParticipants(
    id: string,
    UserId: string,
    beforeParticipantId?: string,
    limit = 10,
  ) {
    const chatRoom = await this.chatRoomsFetcher.getSharedspaceChatRoomById(id);

    const isParticipant = await this.chatRoomsFetcher.isParticipant(UserId, chatRoom.id);

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
        RoomId: chatRoom.id,
        id: LessThan(beforeParticipantId),
        removedAt: IsNull(),
        User: {
          status: USER_STATUS.ACTIVE,
        },
      } : {
        RoomId: chatRoom.id,
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
        RoomId: chatRoom.id,
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

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const RoomId = uuidv7();

      await qr.manager.insert(ChatRooms, {
        id: RoomId,
        type: CHATROOM_TYPE.DM,
      });

      await qr.manager.insert(RoomParticipants, {
        id: uuidv7(),
        UserId,
        RoomId,
      });

      await qr.manager.insert(RoomParticipants, {
        id: uuidv7(),
        UserId: targetUserId,
        RoomId,
      });

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async createChatRoomForSpace(
    SharedspaceId: string,
    name: string,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const RoomId = uuidv7();

      await qr.manager.insert(ChatRooms, {
        id: RoomId,
        name,
        type: CHATROOM_TYPE.SPACE,
      });

      await qr.manager.insert(SharedspaceChatRooms, {
        id: RoomId,
        SharedspaceId,
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