import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CHAT_IMAGE_TOO_LARGE_MESSAGE, CHAT_IMAGE_TOO_MANY_MESSAGE, INTERNAL_SERVER_MESSAGE, NOT_FOUND_RESOURCE } from "src/common/constant/error.message";
import { Chats } from "src/entities/Chats";
import { Images } from "src/entities/Images";
import { RolesService } from "src/roles/roles.service";
import { DataSource, In, IsNull, LessThan, Repository } from "typeorm";
import dayjs from "dayjs";
import { GeneratePresignedPutUrlDTO } from "./dto/generate.presigned.put.url.dto";
import { ChatToClient, IMAGE_STATUS, IMAGE_TYPE } from "src/common/constant/constants";
import { StorageR2Service } from "src/storage/storage.r2.service";
import { SendSharedspacechatDTO } from "src/chats/dto/send.sharedspace.chat.dto";
import { UpdateSharedspaceChatDTO } from "src/chats/dto/update.sharedspace.chat.dto";
import { DeleteSharedspaceChatDTO } from "src/chats/dto/delete.sharedspace.chat.dto";
import { DeleteSharedspaceChatImageDTO } from "src/chats/dto/delete.sharedspace.chat.image.dto";
import { ChatImages } from "src/entities/ChatImages";
import { SpaceMembers } from "src/entities/SpaceMembers";
import { WsException } from "@nestjs/websockets";
import { ERROR_TYPE } from "src/common/constant/auth.constants";
import { ChatRoomsFetcher } from "src/chatrooms/chatrooms.fetcher";

@Injectable()
export class ChatsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Chats)
    private chatsRepository: Repository<Chats>,
    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
    @InjectRepository(ChatImages)
    private chatImagesRepository: Repository<ChatImages>,
    private rolesService: RolesService,
    private storageR2Service: StorageR2Service,
    private chatRoomsFetcher: ChatRoomsFetcher,
  ) {}

  async getSharedspaceChatRoomChats(
    id: string,
    beforeChatId: string,
    UserId?: string,
    limit = 100,
  ) {
    const room = await this.chatRoomsFetcher.getSharedspaceChatRoomById(id);

    if (!room || !room?.SharedspaceId) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    if (room.Sharedspace.private) {
      const isParticipant = await this.rolesService.requireParticipant(UserId, room.SharedspaceId);

      if (!isParticipant) {
        throw new ForbiddenException({
          message: ACCESS_DENIED_MESSAGE,
          metaData: { SharedspaceId: room.SharedspaceId },
        });
      }
    }

    const chatRecords = await this.chatsRepository.find({
      select: {
        id: true,
        content: true,
        SenderId: true,
        createdAt: true,
        updatedAt: true,
        Sender: {
          email: true,
          nickname: true,
          ProfileImage: {
            id: true,
            path: true,
          },
        },
      },
      relations: {
        Sender: {
          ProfileImage: true,
        },
      },
      where: beforeChatId ? {
        RoomId: room.id,
        id: LessThan(beforeChatId),
        removedAt: IsNull(),
      } : {
        RoomId: room.id,
        removedAt: IsNull(),
      },
      order: {
        id: 'DESC',
      },
      take: limit + 1,
    });

    if (!chatRecords.length) {
      return {
        chats: [],
        hasMoreData: false,
      };
    }

    const hasMoreData = chatRecords.length > limit;

    if (hasMoreData) {
      chatRecords.pop();
    }

    const images = await this.chatImagesRepository.find({
      select: {
        id: true,
        ChatId: true,
        path: true,
      },
      where: {
        ChatId: In(chatRecords.map((chat) => chat.id)),
        Image: {
          status: IMAGE_STATUS.ACTIVE,
          removedAt: IsNull(),
        },
      },
    });

    const imagesMap = images.reduce((acc, image) => {
      const { ChatId } = image;

      if (!acc[ChatId]) {
        acc[ChatId] = [];
      }
      acc[ChatId].push(image);
      return acc;
    }, {});

    const chats = chatRecords.map((chat) => {
      return {
        ...chat,
        ChatImages: imagesMap[`${chat.id}`] || [],
        Sender: {
          ...chat.Sender,
          ProfileImage: chat.Sender.ProfileImage?.path,
        },
        permission: {
          isSender: chat.SenderId === UserId,
        },
      };
    });

    return {
      chats,
      hasMoreData,
    };
  }
  
  async getDmChatRoomChats(
    id: string,
    beforeChatId: string,
    UserId: string,
    limit = 100,
  ) {
    const room = await this.chatRoomsFetcher.getSharedspaceChatRoomById(id);

    if (!room) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const isParticipant = await this.chatRoomsFetcher.isParticipant(UserId, room.id);

    if (!isParticipant) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const chatRecords = await this.chatsRepository.find({
      select: {
        id: true,
        content: true,
        SenderId: true,
        createdAt: true,
        updatedAt: true,
        Sender: {
          email: true,
          nickname: true,
          ProfileImage: {
            id: true,
            path: true,
          },
        },
      },
      relations: {
        Sender: {
          ProfileImage: true,
        },
      },
      where: beforeChatId ? {
        RoomId: room.id,
        id: LessThan(beforeChatId),
        removedAt: IsNull(),
      } : {
        RoomId: room.id,
        removedAt: IsNull(),
      },
      order: {
        id: 'DESC',
      },
      take: limit + 1,
    });

    if (!chatRecords.length) {
      return {
        chats: [],
        hasMoreData: false,
      };
    }

    const hasMoreData = chatRecords.length > limit;

    if (hasMoreData) {
      chatRecords.pop();
    }

    const images = await this.chatImagesRepository.find({
      select: {
        id: true,
        ChatId: true,
        path: true,
      },
      where: {
        ChatId: In(chatRecords.map((chat) => chat.id)),
        Image: {
          status: IMAGE_STATUS.ACTIVE,
          removedAt: IsNull(),
        },
      },
    });

    const imagesMap = images.reduce((acc, image) => {
      const { ChatId } = image;

      if (!acc[ChatId]) {
        acc[ChatId] = [];
      }
      acc[ChatId].push(image);
      return acc;
    }, {});

    const chats = chatRecords.map((chat) => {
      return {
        ...chat,
        ChatImages: imagesMap[`${chat.id}`] || [],
        Sender: {
          ...chat.Sender,
          ProfileImage: chat.Sender.ProfileImage?.path,
        },
        permission: {
          isSender: chat.SenderId === UserId,
        },
      };
    });

    return {
      chats,
      hasMoreData,
    };
  }

  async createSharedspaceChat(
    dto: SendSharedspacechatDTO,
    UserId: string,
  ) {
    const { id, ChatId, content, imageIds, imageKeys } = dto;

    const room = await this.chatRoomsFetcher.getSharedspaceChatRoomById(id);

    if (!room) {
      throw new WsException({
        type: ERROR_TYPE.BAD_REQUEST_ERROR,
        message: BAD_REQUEST_MESSAGE,
      });
    }

    const isParticipant = await this.rolesService.requireParticipant(UserId, room.SharedspaceId);

    if (!isParticipant) {
      throw new WsException({
        type: ERROR_TYPE.UNAUTHORIZED_ERROR,
        message: ACCESS_DENIED_MESSAGE,
      });
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      await qr.manager.insert(Chats, {
        id: ChatId,
        content,
        SenderId: UserId,
        RoomId: room.id,
      });

      if (imageIds.length) {
        const updatePromises = imageIds.map(async (imageId, i) => {
          await qr.manager.update(Images, { id: imageId }, { status: IMAGE_STATUS.ACTIVE });
          await qr.manager.insert(ChatImages, { id: imageId, path: imageKeys[i], ChatId, });
        });

        await Promise.all(updatePromises);
      }

      await qr.commitTransaction();

      const result = await this.chatsRepository.findOne({
        select: {
          id: true,
          content: true,
          SenderId: true,
          createdAt: true,
          updatedAt: true,
          Sender: {
            email: true,
            nickname: true,
            ProfileImage: {
              id: true,
              path: true,
            },
          },
          ChatImages: {
            id: true,
            path: true,
          },
        },
        relations: {
          Sender: {
            ProfileImage: true,
          },
          ChatImages: true,
        },
        where: {
          id: ChatId,
        },
      });

      const chatWithUser = {
        ...result,
        Sender: {
          ...result.Sender,
          ProfileImage: result.Sender.ProfileImage?.path,
        },
      };

      return {
        sender: Object.assign({ ...chatWithUser }, { permission: { isSender: true } }),
        receiver: Object.assign({ ...chatWithUser }, { permission: { isSender: false } }),
      };
    } catch (err) {
      await qr.rollbackTransaction();

      if (!(err instanceof WsException)) {
        throw new WsException({
          type: ERROR_TYPE.INTERNAL_SERVER_ERROR,
          message: INTERNAL_SERVER_MESSAGE,
        });
      }

      throw err;
    } finally {
      await qr.release();
    }
  }

  async updateSharedspaceChat(
    dto: UpdateSharedspaceChatDTO,
    UserId: string,
  ) {
    const { id, ChatId, content } = dto;

    try {
      const room = await this.chatRoomsFetcher.getSharedspaceChatRoomById(id);

      const updatedAt = dayjs().toDate();

      const result = await this.chatsRepository.update(
        {
          id: ChatId,
          SenderId: UserId,
          RoomId: room.id,
        },
        {
          content,
          updatedAt,
        }
      );

      if (!result.affected) {
        throw new WsException({
          type: ERROR_TYPE.BAD_REQUEST_ERROR,
          message: BAD_REQUEST_MESSAGE,
        });
      }

      return { id: ChatId, content, updatedAt };
    } catch (err) {
      if (!(err instanceof WsException)) {
        throw new WsException({
          type: ERROR_TYPE.INTERNAL_SERVER_ERROR,
          message: INTERNAL_SERVER_MESSAGE,
        });
      }

      throw err;
    }
  };

  async deleteSharedspaceChat(
    dto: DeleteSharedspaceChatDTO,
    UserId: string,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const { id, ChatId } = dto;

    try {
      const room = await this.chatRoomsFetcher.getSharedspaceChatRoomById(id);

      const targetChat = await this.chatsRepository.findOne({
        select: {
          id: true,
          SenderId: true,
          RoomId: true,
          ChatImages: {
            id: true,
          },
        },
        relations: {
          ChatImages: true,
        },
        where: {
          id: ChatId,
        },
      });

      if (
        targetChat?.SenderId !== UserId ||
        targetChat?.RoomId !== room.id
      ) {
        throw new WsException({
          type: ERROR_TYPE.BAD_REQUEST_ERROR,
          message: BAD_REQUEST_MESSAGE,
        });
      }

      const now = dayjs().toDate();

      const softDeletePromises = targetChat.ChatImages.map(chatImage =>
        qr.manager.update(Images, { id: chatImage.id }, { status: IMAGE_STATUS.DELETED, removedAt: now })
      );
      await Promise.all(softDeletePromises);

      await qr.manager.update(Chats, { id: targetChat.id }, { removedAt: now });

      await qr.commitTransaction();

      return ChatId;
    } catch (err) {
      await qr.rollbackTransaction();

      if (!(err instanceof WsException)) {
        throw new WsException({
          type: ERROR_TYPE.INTERNAL_SERVER_ERROR,
          message: INTERNAL_SERVER_MESSAGE,
        });
      }

      throw err;
    } finally {
      await qr.release();
    }
  }

  async deleteSharedspaceChatImage(
    dto: DeleteSharedspaceChatImageDTO,
    UserId: string,
  ) {
    const { id, ChatId, ImageId } = dto;
    const room = await this.chatRoomsFetcher.getSharedspaceChatRoomById(id);

    const targetChat = await this.chatsRepository.findOne({
      select: {
        id: true,
        SenderId: true,
        RoomId: true,
        content: true,
        ChatImages: {
          id: true,
          path: true,
        },
      },
      relations: {
        ChatImages: true,
      },
      where: {
        id: ChatId,
      },
    });

    if (
      targetChat?.SenderId !== UserId ||
      targetChat?.RoomId !== room.id ||
      !targetChat.ChatImages.find(chatImage => chatImage.id === ImageId)
    ) {
      throw new WsException({
        type: ERROR_TYPE.BAD_REQUEST_ERROR,
        message: BAD_REQUEST_MESSAGE,
      });
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const now = dayjs().toDate();

    try {
      if (targetChat.ChatImages.length === 1 && !targetChat.content) {
        await qr.manager.update(Images, { id: ImageId }, { status: IMAGE_STATUS.DELETED, removedAt: now });
        await qr.manager.update(Chats, { id: targetChat.id }, { removedAt: now });

        await qr.commitTransaction();

        return {
          event: ChatToClient.CHAT_DELETED,
          data: { id: ChatId },
        };
      }

      await qr.manager.update(Images, { id: ImageId }, { status: IMAGE_STATUS.DELETED, removedAt: now });

      await qr.commitTransaction();

      return {
        event: ChatToClient.CHAT_IMAGE_DELETED,
        data: { ChatId, ImageId },
      };
    } catch (err) {
      await qr.rollbackTransaction();

      if (!(err instanceof WsException)) {
        throw new WsException({
          type: ERROR_TYPE.INTERNAL_SERVER_ERROR,
          message: INTERNAL_SERVER_MESSAGE,
        });
      }

      throw err;
    } finally {
      await qr.release();
    }
  }

  async generatePresignedPutUrl(
    id: string,
    dto: GeneratePresignedPutUrlDTO,
  ) {
    const { metaDatas } = dto;

    if (metaDatas.length > 6) {
      throw new BadRequestException(CHAT_IMAGE_TOO_MANY_MESSAGE);
    }

    const batch = metaDatas.map(async (metaData) => {
      const { id: ImageId, fileName, fileSize, contentType } = metaData;

      if (fileSize >= 5 * 1024 * 1024) {
        throw new BadRequestException(CHAT_IMAGE_TOO_LARGE_MESSAGE);
      }
      
      const key = this.storageR2Service.generateStorageKey(id, fileName);
      const presignedUrl = await this.storageR2Service.generatePresignedPutUrl(key, contentType);
      await this.imagesRepository.insert({ id: ImageId, status: IMAGE_STATUS.PENDING, type: IMAGE_TYPE.CHAT });

      return {
        key,
        presignedUrl,
        contentType,
      };
    })

    const keyAndUrls = await Promise.all(batch);

    return keyAndUrls;
  }
}