import { InjectRepository } from "@nestjs/typeorm";
import { ChatRooms } from "src/entities/ChatRooms";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { TChatRoomDefault } from "src/typings/types";
import { RoomParticipants } from "src/entities/RoomParticipants";
import { Inject } from "@nestjs/common";
import { SharedspaceChatRooms } from "src/entities/SharedspaceChatRooms";

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

  async getSharedspaceChatRoomById(id: string): Promise<TChatRoomDefault> {
    const cacheKey = `chatRoom:${id}`;

    const cachedItem = await this.cacheManager.get<TChatRoomDefault>(cacheKey);

    if (cachedItem) {
      return cachedItem;
    }

    const record = await this.sharedspaceChatRoomsRepository.findOne({
      select: {
        id: true,
        SharedspaceId: true,
        ChatRoom: {
          name: true,
          type: true,
        },
        Sharedspace: {
          private: true,
        },
      },
      where: {
        id,
      },
      relations: {
        ChatRoom: true,
        Sharedspace: true,
      },
    });

    const { ChatRoom, ...rest } = record;

    const chatRoom = {
      ...rest,
      name: ChatRoom.name,
      type: ChatRoom.type,
    };

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