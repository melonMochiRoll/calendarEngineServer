import { InjectRepository } from "@nestjs/typeorm";
import { ChatRooms } from "src/entities/ChatRooms";
import { IsNull, Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { TSharedspaceChatRoomDefault } from "src/typings/types";
import { RoomParticipants } from "src/entities/RoomParticipants";
import { Inject } from "@nestjs/common";
import { SharedspaceChatRooms } from "src/entities/SharedspaceChatRooms";
import { CHATROOM_TYPE } from "src/common/constant/constants";

export class ChatRoomsFetcher {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(ChatRooms)
    private chatRoomsRepository: Repository<ChatRooms>,
    @InjectRepository(SharedspaceChatRooms)
    private sharedspaceChatRoomsRepository: Repository<SharedspaceChatRooms>,
    @InjectRepository(RoomParticipants)
    private roomParticipantsRepository: Repository<RoomParticipants>,
  ) {}

  async getSharedspaceChatRoomById(id: string): Promise<TSharedspaceChatRoomDefault> {
    const cacheKey = `chatRoom:${id}`;

    const cachedItem = await this.cacheManager.get<TSharedspaceChatRoomDefault>(cacheKey);

    if (cachedItem) {
      return cachedItem;
    }

    const chatRoom = await this.sharedspaceChatRoomsRepository.findOne({
      select: {
        id: true,
        name: true,
        SharedspaceId: true,
        Sharedspace: {
          private: true,
        },
      },
      where: {
        id,
        ChatRoom: {
          type: CHATROOM_TYPE.SPACE,
          removedAt: IsNull(),
        },
      },
      relations: {
        Sharedspace: true,
      },
    });

    const minute = 60000;

    await this.cacheManager.set(cacheKey, chatRoom, 10 * minute);
    return chatRoom;
  }

  async isParticipant(
    UserId: string,
    RoomId: string,
  ) {
    const cacheKey = `isParticipants:${UserId}:${RoomId}`;

    const cachedItem = await this.cacheManager.get<boolean>(cacheKey);

    if (cachedItem) {
      return cachedItem;
    }

    const record = await this.roomParticipantsRepository.findOne({
      select: {
        id: true,
      },
      where: {
        UserId,
        RoomId,
      },
    });

    const isParticipant = Boolean(record);
    const minute = 60000;

    if (isParticipant) {
      await this.cacheManager.set(cacheKey, isParticipant, 5 * minute);
    }
    
    return isParticipant;
  }
}