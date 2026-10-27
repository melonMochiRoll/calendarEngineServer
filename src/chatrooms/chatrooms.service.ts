import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { nanoid } from "nanoid";
import { CACHE_EMPTY_SYMBOL, CHATROOM_TYPE, REDIS_CHATROOM_LIST_MAX, USER_STATUS } from "src/common/constant/constants";
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
import dayjs, { Dayjs } from "dayjs";
import { InviteDmChatRoomDTO } from "./dto/invite.dm.chatroom";
import { stringToUUID, uuidToString } from "src/common/function/utilFunctions";
import { RedisClientService } from "src/redisClient/redisClient.service";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { Users } from "src/entities/Users";
import { TChatRoomParticipantsDefault } from "src/typings/types";

@Injectable()
export class ChatRoomsService {
  constructor(
    @InjectRedis()
    private redis: Redis,
    private dataSource: DataSource,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
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
    beforelastMessageAt?: Dayjs,
    limit = 20,
    day = 7,
  ) {
    const hasMoreInDbKey = `user:${UserId}:dm_chatrooms:warm_up`;
    const hasMoreInDb = await this.redis.get(hasMoreInDbKey);

    if (hasMoreInDb === null) {
      return await this.warmUp(hasMoreInDbKey, UserId, limit, day);
    }

    const key = `user:${UserId}:dm_chatrooms`;
    const dmChatRoomResponse = await this.getDmChatRoomsWithRedis(key, limit, beforelastMessageAt);

    if (dmChatRoomResponse.chatRooms.length < limit) {
      if (hasMoreInDb === '0') return dmChatRoomResponse;

      const rest = await this.getDmChatRoomsFromDB(UserId, limit - dmChatRoomResponse.chatRooms.length, beforelastMessageAt)

      return {
        chatRooms: [ ...dmChatRoomResponse.chatRooms, ...rest.chatRooms ],
        hasMoreData: rest.hasMoreData,
      };
    }
    
    return dmChatRoomResponse;
  }
  
  async warmUp(
    hasMoreInDbKey: string,
    UserId: string,
    limit: number,
    day: number,
  ) {
    const dmChatRoomResponseFromDB = await this.getDmChatRoomsFromDB(UserId, 100);

    const pipeline = this.redis.pipeline();
    const key = `user:${UserId}:dm_chatrooms`;
    const ONE_DAY_MS = 1000 * 60 * 60 * 24;
    const ttl = ONE_DAY_MS * day;

    const batchLength = dmChatRoomResponseFromDB.chatRooms.length;

    const end = await this.redis.incrby(`seq:dm_chatrooms:last_message_at`, batchLength);
    const start = end - batchLength + 1;

    let seq = start;
    for (const { id: ChatRoomId, lastMessageAt } of dmChatRoomResponseFromDB.chatRooms) {
      const uniqueTimestamp = dayjs(lastMessageAt).valueOf() * 1000 + ((seq++) % 1000);
      pipeline.zadd(key, uniqueTimestamp, ChatRoomId);
    }
    pipeline.pexpire(key, ttl);

    await pipeline.exec();

    const hasMoreInDb = dmChatRoomResponseFromDB.hasMoreData;
    await this.redis.set(hasMoreInDbKey, hasMoreInDb ? '1' : '0', 'PX', ttl - 10000);

    return {
      chatRooms: dmChatRoomResponseFromDB.chatRooms.slice(0, limit),
      hasMoreData: dmChatRoomResponseFromDB.chatRooms.length > limit,
    };
  }

  async getDmChatRoomsWithRedis(
    key: string,
    limit: number,
    beforelastMessageAt?: Dayjs,
  ) {
    const max = beforelastMessageAt ? `(${beforelastMessageAt.valueOf()}` : '+inf';

    const chatRoomIds = await this.redis.zrange(
      key,
      max,
      '-inf',
      'BYSCORE',
      'REV',
      'LIMIT',
      0,
      limit + 1,
    )
      .catch(err => console.error(`Redis 키 조회 실패 : ${key}`, err));

    if (!chatRoomIds) {
      return {
        chatRooms: [],
        hasMoreData: false,
      };
    }

    const hasMoreData = chatRoomIds.length > limit;

    if (hasMoreData) {
      chatRoomIds.pop();
    }

    const chatRoomRecords = await this.dmChatRoomsRepository.find({
      select: {
        id: true,
        name: true,
        lastMessageAt: true,
        previewUserIds: true,
      },
      where: {
        id: In(chatRoomIds),
        ChatRoom: {
          type: CHATROOM_TYPE.DM,
          removedAt: IsNull(),
        },
      },
      order: {
        lastMessageAt: 'DESC',
      },
    });

    const previewUserIdsArray = chatRoomRecords.reduce((acc, chatRecord) => {
      return [ ...acc, ...chatRecord.previewUserIds ];
    }, []);

    const previewUserIdRecords = await this.usersRepository.find({
      select: {
        id: true,
        email: true,
        nickname: true,
        ProfileImage: {
          path: true,
        },
      },
      where: {
        id: In(previewUserIdsArray),
        removedAt: IsNull(),
      },
      relations: {
        ProfileImage: true,
      },
    });

    const previewUserIdsMap = previewUserIdRecords.reduce((acc, user) => {
      const { ProfileImage, ...rest } = user;

      acc.set(user.id, {
        ...rest,
        ProfileImage: ProfileImage.path,
      });
      return acc;
    }, new Map());

    const chatRooms = chatRoomRecords.map(dmChatRoom => {
      const { previewUserIds, ...rest } = dmChatRoom;
      const previewUsers = previewUserIds.map(id => previewUserIdsMap.get(id));

      return {
        ...rest,
        previewUsers,
      };
    });

    return {
      chatRooms,
      hasMoreData,
    };
  }

  async getDmChatRoomsFromDB(
    UserId: string,
    limit: number,
    beforelastMessageAt?: Dayjs,
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
            previewUserIds: true,
          },
        },
      },
      where: beforelastMessageAt ? {
        UserId,
        removedAt: IsNull(),
        ChatRoom: {
          type: CHATROOM_TYPE.DM,
          removedAt: IsNull(),
          DmChatRoom: {
            lastMessageAt: LessThan(beforelastMessageAt.toDate()),
          },
        },
      } : {
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

    const previewUserIdsArray = chatRoomRecords.reduce((acc, chatRecord) => {
      return [ ...acc, ...chatRecord.ChatRoom.DmChatRoom.previewUserIds ];
    }, []);

    const previewUserIdRecords = await this.usersRepository.find({
      select: {
        id: true,
        email: true,
        nickname: true,
        ProfileImage: {
          path: true,
        },
      },
      where: {
        id: In(previewUserIdsArray),
        removedAt: IsNull(),
      },
      relations: {
        ProfileImage: true,
      },
    });

    const previewUserIdsMap = previewUserIdRecords.reduce((acc, user) => {
      const { ProfileImage, ...rest } = user;

      acc.set(user.id, {
        ...rest,
        ProfileImage: ProfileImage.path,
      });
      return acc;
    }, new Map());

    const chatRooms = chatRoomRecords.map(roomParticipant => {
      const { ChatRoom } = roomParticipant;
      const previewUsers = ChatRoom.DmChatRoom.previewUserIds.map(id => previewUserIdsMap.get(id));

      return {
        id: ChatRoom.id,
        name: ChatRoom.DmChatRoom.name,
        lastMessageAt: ChatRoom.DmChatRoom.lastMessageAt,
        previewUsers,
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
    limit = 30,
  ): Promise<TChatRoomParticipantsDefault> {
    const isParticipant = await this.chatRoomsFetcher.isParticipant(UserId, RoomId);

    if (!isParticipant) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const cacheKey = `room_participants:${RoomId}`;

    try {
      if (!beforeParticipantId) {
        const cachedItem = await this.redisClientService.get<TChatRoomParticipantsDefault>(cacheKey);

        if (cachedItem) {
          return cachedItem;
        }
      }
    } catch (err) {
      console.error(`Redis 키 조회 실패 : ${cacheKey}`, err);
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

    const participants = participantRecords.map((member) => {
      const { User, ...rest } = member;
      return {
        ...rest,
        email: User.email,
        nickname: User.nickname,
        ProfileImage: User.ProfileImage?.path,
      };
    });

    const response = {
      participants,
      hasMoreData,
    };

    const minute = 60000;

    try {
      if (!beforeParticipantId) {
        await this.redisClientService.set(cacheKey, response, 5 * minute);
      }
    } catch (err) {
      console.error(`Redis 키 저장 실패 : ${cacheKey}`, err);
    }

    return response;
  }

  async getChatRoomParticipantCount(
    ChatRoomId: string,
    UserId: string,
  ) {
    const isParticipant = await this.chatRoomsFetcher.isParticipant(UserId, ChatRoomId);

    if (!isParticipant) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

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
        removedAt: IsNull(),
        User: {
          status: USER_STATUS.ACTIVE,
        },
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

  async createDmChatRoom(
    UserId: string,
    dto: CreateDmChatRoomDTO,
  ) {
    const { targetUserId } = dto;
    const targetUserIds = [ UserId, targetUserId ];

    const [ UserId1, UserId2 ] = targetUserIds.sort();
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

    const now = dayjs();

    try {
      const RoomId = uuidv7();

      await qr.manager.upsert(ChatRooms, {
        id: RoomId,
        type: CHATROOM_TYPE.DM,
      }, ['id']);

      await qr.manager.upsert(DmChatRooms, {
        id: RoomId,
        lastMessageAt: now.toDate(),
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

      const batchLength = targetUserIds.length;
      const ONE_DAY_MS = 1000 * 60 * 60 * 24;
      const ttl = ONE_DAY_MS * 7;

      const end = await this.redis.incrby(`seq:dm_chatrooms:last_message_at`, batchLength);
      const start = end - batchLength + 1;

      const pipeline = this.redis.pipeline();

      let seq = start;
      for (const targetUserId of targetUserIds) {
        const key = `user:${targetUserId}:dm_chatrooms`;
        const uniqueTimestamp = now.valueOf() * 1000 + ((seq++) % 1000);

        pipeline.zadd(key, uniqueTimestamp, RoomId);
        pipeline.pexpire(key, ttl);
        pipeline.zremrangebyrank(key, 0, -(REDIS_CHATROOM_LIST_MAX + 1));
      }
   
      await pipeline.exec();

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

      const batchLength = targetUserIds.length;
      const now = dayjs().valueOf();

      const ONE_DAY_MS = 1000 * 60 * 60 * 24;
      const ttl = ONE_DAY_MS * 7;

      const end = await this.redis.incrby(`seq:dm_chatrooms:last_message_at`, batchLength);
      const start = end - batchLength + 1;

      const pipeline = this.redis.pipeline();

      let seq = start;
      for (const targetUserId of targetUserIds) {
        const key = `user:${targetUserId}:dm_chatrooms`;
        const uniqueTimestamp = now * 1000 + ((seq++) % 1000);

        pipeline.zadd(key, uniqueTimestamp, ChatRoomId);
        pipeline.pexpire(key, ttl);
        pipeline.zremrangebyrank(key, 0, -(REDIS_CHATROOM_LIST_MAX + 1));
      }
   
      await pipeline.exec();
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }

    await this.redisClientService.del(`chatRoom:${ChatRoomId}`);
    await this.redisClientService.del(`room_participants:${ChatRoomId}`);
    await this.redisClientService.del(`room_participants:${ChatRoomId}:ids`);
    await this.redisClientService.del(`room_participants:${ChatRoomId}:count`);
  }

  async leaveDmChatRoom(
    ChatRoomId: string,
    UserId: string,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const { previewUserIds } = await this.chatRoomsFetcher.getDmChatRoomById(ChatRoomId);

    try {
      const newPreviewUserIds = previewUserIds.filter(id => UserId !== id);
      const now = dayjs().toDate();

      if (!newPreviewUserIds.length) {
        await qr.manager.update(ChatRooms,
          { id: ChatRoomId },
          { removedAt: now },
        );
      } 
      
      if (previewUserIds.length !== newPreviewUserIds.length) {
        await qr.manager.update(DmChatRooms,
          { id: ChatRoomId },
          {
            previewUserIds: newPreviewUserIds,
          },
        );
      }

      await qr.manager.update(RoomParticipants,
        {
          UserId,
          RoomId: ChatRoomId,
        },
        {
          removedAt: now,
        }
      );

      await qr.commitTransaction();

      await this.redis.zrem(`user:${UserId}:dm_chatrooms`, ChatRoomId);
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }

    await this.redisClientService.del(`room_participants:${ChatRoomId}`);
    await this.redisClientService.del(`room_participants:${ChatRoomId}:ids`);
    await this.redisClientService.del(`room_participants:${ChatRoomId}:count`);
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

    const seen = new Set();
    const uniqueBatch = [...currentBatch.entries()]
      .filter(([ChatRoomId]) => {
        if (seen.has(ChatRoomId)) return false;
        seen.add(ChatRoomId);
        return true;
      });

    const participantIdsMap: Record<string, string[]> = {};

    for (const [ChatRoomId] of uniqueBatch) {
      const participantIds = await this.getParticipantIds(ChatRoomId);
      if (participantIds.length) {
        participantIdsMap[ChatRoomId] = participantIds;
      }
    }

    const promises = uniqueBatch
      .map(async ([ChatRoomId, timestamp]) => {
        const participantIds = participantIdsMap[ChatRoomId];

        const lastSeens = await this.redis.mget(
          participantIds.map(UserId => `user:${UserId}:last_seen`)
        );

        const recentlyActiveUserIds = participantIds
          .filter((_, idx) => lastSeens[idx]);

        return {
          UserIds: recentlyActiveUserIds,
          ChatRoomId,
          timestamp,
        };
      });

    const flatBatch = await Promise.all(promises);
    const batchLength = flatBatch.reduce((acc, item) => acc+item.UserIds.length, 0);
    if (batchLength === 0) return; 

    const pipeline = this.redis.pipeline();

    const ONE_DAY_MS = 1000 * 60 * 60 * 24;
    const ttl = ONE_DAY_MS * day;

    const end = await this.redis.incrby(`seq:dm_chatrooms:last_message_at`, batchLength);
    const start = end - batchLength + 1;

    let seq = start;
    for (const { UserIds, ChatRoomId, timestamp } of flatBatch) {
      for (const UserId of UserIds) {
        const uniqueTimestamp = timestamp * 1000 + ((seq++) % 1000);
        const chatRoomsKey = `user:${UserId}:dm_chatrooms`;
        const hasMoreInDbKey = `user:${UserId}:dm_chatrooms:warm_up`;

        pipeline.zadd(chatRoomsKey, uniqueTimestamp, ChatRoomId);
        pipeline.pexpire(chatRoomsKey, ttl);
        pipeline.pexpire(hasMoreInDbKey, ttl - 10000);
        pipeline.zremrangebyrank(chatRoomsKey, 0, -(REDIS_CHATROOM_LIST_MAX + 1));
      }
    }

    await pipeline.exec();
  }
}