import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { nanoid } from "nanoid";
import { CACHE_EMPTY_SYMBOL, CHATROOM_TYPE, USER_STATUS } from "src/common/constant/constants";
import { ACCESS_DENIED_MESSAGE } from "src/common/constant/error.message";
import { ChatRooms } from "src/entities/ChatRooms";
import { DataSource, In, IsNull, LessThan, Repository } from "typeorm";
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
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";

@Injectable()
export class ChatRoomsService {
  constructor(
    @InjectRedis()
    private redis: Redis,
    private dataSource: DataSource,
    @InjectRepository(ChatRooms)
    private chatRoomsRepository: Repository<ChatRooms>,
    @InjectRepository(SharedspaceChatRooms)
    private sharedspaceChatRoomsRepository: Repository<SharedspaceChatRooms>,
    @InjectRepository(DmChatRooms)
    private dmChatRoomsRepository: Repository<DmChatRooms>,
    @InjectRepository(RoomParticipants)
    private roomParticipantsRepository: Repository<RoomParticipants>,
    private rolesService: RolesService,
    private redisClientService: RedisClientService,
    private chatRoomsFetcher: ChatRoomsFetcher,
    private sharedspaceFetcher: SharedspaceFetcher,
  ) {
    this.redisFlushBufferInterval = setInterval(() => this.redisFlushBuffer(this.redisLastMessageAtBuffer), 1000);
  }

  private redisLastMessageAtBuffer: Map<string, number> = new Map();
  private redisFlushBufferInterval: NodeJS.Timeout;

 async getDmChatRooms(
    UserId: string,
    page = 1,
    limit = 20,
    day = 7,
  ) {
    const key = `user:${UserId}:dm_chatrooms`;
    const dmChatRoomResponse = await this.getDmChatRoomsWithRedis(key, page, limit);

    if (!dmChatRoomResponse || !dmChatRoomResponse.chatRooms.length) {
      const dmChatRoomResponse = await this.getDmChatRoomsFromDB(UserId, page, limit);

      if (page === 1) {
        const pipeline = this.redis.pipeline();
        const key = `user:${UserId}:dm_chatrooms`;
        const ONE_DAY_MS = 1000 * 60 * 60 * 24;

        for (const { id: ChatRoomId, lastMessageAt } of dmChatRoomResponse.chatRooms) {
          pipeline.zadd(key, dayjs(lastMessageAt).valueOf(), ChatRoomId);
        }
        pipeline.pexpire(key, ONE_DAY_MS * day);

        await pipeline.exec();
      }

      return dmChatRoomResponse;
    }
    
    return dmChatRoomResponse;
  }

  async getDmChatRoomsWithRedis(
    key: string,
    page: number,
    limit: number,
  ) {
    const start = (page - 1) * limit;
    const stop = start + limit - 1;

    const chatRoomIds = await this.redis.zrange(
      key,
      start,
      stop,
      'REV'
    )
      .catch(err => console.error(`Redis 키 조회 실패 : ${key}`, err));

    if (!chatRoomIds) {
      return {
        chatRooms: [],
        hasMoreData: false,
      };
    }

    const chatRoomRecords = await this.dmChatRoomsRepository.find({
      select: {
        id: true,
        name: true,
        lastMessageAt: true,
      },
      where: {
        id: In(chatRoomIds),
      },
      order: {
        lastMessageAt: 'DESC',
      },
    });

    return {
      chatRooms: chatRoomRecords,
      hasMoreData: true,
    };
  }

  async getDmChatRoomsFromDB(
    UserId: string,
    page: number,
    limit: number,
  ) {
    const chatRoomRecords = await this.roomParticipantsRepository.find({
      select: {
        id: true,
        ChatRoom: {
          id: true,
          DmChatRoom: {
            id: true,
            name: true,
            lastMessageAt: true,
          },
        },
      },
      where: {
        UserId,
        removedAt: IsNull(),
        ChatRoom: {
          type: CHATROOM_TYPE.DM,
          removedAt: IsNull(),
        },
      },
      relations: {
        ChatRoom: {
          DmChatRoom: true,
        },
      },
      order: {
        ChatRoom: {
          DmChatRoom: {
            lastMessageAt: 'DESC',
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit + 1,
    });

    if (!chatRoomRecords.length) {
      return {
        chatRooms: [],
        hasMoreData: false,
      };
    }

    const hasMoreData = chatRoomRecords.length > limit;

    if (hasMoreData) {
      chatRoomRecords.pop();
    }

    const chatRooms = chatRoomRecords.map(roomParticipant => {
      const { id, ChatRoom } = roomParticipant;

      return {
        id,
        name: ChatRoom.DmChatRoom.name,
        lastMessageAt: ChatRoom.DmChatRoom.lastMessageAt,
      };
    });

    return {
      chatRooms,
      hasMoreData,
    };
  }

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

    const [ UserId1, UserId2 ] = [UserId, targetUserId].sort();
    const cacheKey = `roomParticipants:oneOnOne:${UserId1}:${UserId2}`;

    try {
      const cachedItem = await this.redisClientService.get<{ ChatRoomId: string }>(cacheKey);

      if (cachedItem) {
        return { ChatRoomId: cachedItem.ChatRoomId };
      }
    } catch (err) {
      console.error(`Redis 키 조회 실패 : ${cacheKey}`, err);
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

    try {
      if (oneOnOneChatRoom) {
        const result = { ChatRoomId: uuidToString(oneOnOneChatRoom.RoomId) };

        await this.redisClientService.set(cacheKey, result, 5 * minute);
        return result;
      }
    } catch (err) {
      console.error(`Redis 키 저장 실패 : ${cacheKey}`, err);
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
        previewUserIds: [ UserId1, UserId2 ],
      }, ['id']);

      await qr.manager.upsert(RoomParticipants, {
        id: uuidv7(),
        UserId: UserId1,
        RoomId,
      }, ['UserId', 'RoomId']);

      await qr.manager.upsert(RoomParticipants, {
        id: uuidv7(),
        UserId: UserId2,
        RoomId,
      }, ['UserId', 'RoomId']);

      await qr.commitTransaction();

      try {
        await this.redisClientService.set(cacheKey, { ChatRoomId: RoomId }, 5 * minute);
      } catch (err) {
        console.error(`Redis 키 저장 실패 : ${cacheKey}`, err);
      }

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

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const participantCount = await this.getParticipantCount(ChatRoomId);

    try {
      if (participantCount > 4) {
        const getDmChatRoomById = await this.chatRoomsFetcher.getDmChatRoomById(ChatRoomId);
        const newPreviewUserIds = [ ...getDmChatRoomById.previewUserIds, ...targetUserIds ].slice(0, 4);
        
        await qr.manager.update(DmChatRooms,
          { id: ChatRoomId },
          {
            previewUserIds: newPreviewUserIds,
          },
        );
      }

      const entities = targetUserIds.map(targetUserId => {
        return {
          UserId: targetUserId,
          RoomId: ChatRoomId,
        };
      });

      await qr.manager.insert(RoomParticipants, entities);

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }

    await this.redisClientService.del(`chatRoom:${ChatRoomId}`);
    await this.redisClientService.del(`room_participants:${ChatRoomId}:ids`);
    await this.redisClientService.del(`room_participants:${ChatRoomId}:count`);
  }

  async leaveDmChatRoom(
    ChatRoomId: string,
    UserId: string,
  ) {
    await this.roomParticipantsRepository.delete({
      UserId,
      RoomId: ChatRoomId,
    });
    await this.redisClientService.del(`roomParticipantIds:${ChatRoomId}`);
  }

  async getParticipantIds(ChatRoomId: string) {
    const cacheKey = `room_participants:${ChatRoomId}:ids`;

    try {
      const cachedItem = await this.redisClientService.get<string[]>(cacheKey);

      if (cachedItem) {
        return cachedItem;
      }
    } catch (err) {
      console.error(`Redis 키 조회 실패 : ${cacheKey}`, err);
    }

    const roomParticipantRecords = await this.roomParticipantsRepository.find({
      select: {
        UserId: true,
      },
      where: {
        RoomId: ChatRoomId,
      },
    });

    const ids = roomParticipantRecords.map(roomParticipant => {
      return roomParticipant.UserId;
    });

    const minute = 60000;

    try {
      await this.redisClientService.set(cacheKey, ids, 5 * minute);
    } catch (err) {
      console.error(`Redis 키 저장 실패 : ${cacheKey}`, err);
    }

    return ids;
  }

  async getParticipantCount(ChatRoomId: string) {
    const cacheKey = `room_participants:${ChatRoomId}:count`;

    try {
      const cachedItem = await this.redisClientService.get<number>(cacheKey);

      if (cachedItem) {
        return cachedItem;
      }
    } catch (err) {
      console.error(`Redis 키 조회 실패 : ${cacheKey}`, err);
    }

    const participantCount = await this.roomParticipantsRepository.count({
      where: {
        RoomId: ChatRoomId,
      },
    });

    const minute = 60000;

    try {
      await this.redisClientService.set(cacheKey, participantCount, 5 * minute);
    } catch (err) {
      console.error(`Redis 키 저장 실패 : ${cacheKey}`, err);
    }

    return participantCount;
  }

  redisBufferLastMessageAt(ChatRoomId: string, timestamp: number) {
    this.redisLastMessageAtBuffer.set(ChatRoomId, timestamp);
  }

  async redisFlushBuffer(
    buffer: typeof this.redisLastMessageAtBuffer,
    day = 7,
  ) {
    if (buffer.size === 0) return;

    const currentBatch = new Map(buffer);
    this.redisLastMessageAtBuffer.clear();

    const pipeline = this.redis.pipeline();

    for (const [ChatRoomId, timestamp] of currentBatch.entries()) {
      const participantIds = await this.getParticipantIds(ChatRoomId);

      const lastSeenPromises = participantIds.map(UserId => this.redisClientService.get(`user:${UserId}:last_seen`));
      const lastSeens = await Promise.all(lastSeenPromises);

      const recentlyActiveUserIds = participantIds.filter((_, idx) => lastSeens[idx]);

      for (const UserId of recentlyActiveUserIds) {
        const key = `user:${UserId}:dm_chatrooms`;
        const ONE_DAY_MS = 1000 * 60 * 60 * 24;

        pipeline.zadd(key, timestamp, ChatRoomId);
        pipeline.pexpire(key, ONE_DAY_MS * day);
        pipeline.zremrangebyrank(key, 0, -101);
      }
    }

    await pipeline.exec();
  }
}