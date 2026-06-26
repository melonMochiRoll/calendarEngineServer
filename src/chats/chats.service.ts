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
import { Spaces } from "src/entities/Spaces";
import { SpaceMembers } from "src/entities/SpaceMembers";
import { WsException } from "@nestjs/websockets";
import { ERROR_TYPE } from "src/common/constant/auth.constants";
import { SharedspaceFetcher } from "src/sharedspaces/sharedspaces.fetcher";

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
    private sharedspaceFetcher: SharedspaceFetcher,
  ) {}

  async getSharedspaceChats(
    url: string,
    beforeChatId: string,
    UserId?: string,
    limit = 100,
  ) {
    const space = await this.sharedspaceFetcher.getSharedspaceByUrl(url);

    if (!space) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    if (space.private) {
      const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

      if (!isParticipant) {
        throw new ForbiddenException({
          message: ACCESS_DENIED_MESSAGE,
          metaData: { spaceUrl: space.url },
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
        SpaceId: space.id,
        id: LessThan(beforeChatId),
        removedAt: IsNull(),
      } : {
        SpaceId: space.id,
        removedAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });

    if (!chatRecords.length) {
      return {
        chats: [],
        hasMoreData: false,
      };
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

    const totalCount = await this.chatsRepository.count({
      where: {
        SpaceId: space.id,
        id: LessThan(chats[chats.length-1].id),
        removedAt: IsNull(),
      },
    });

    return {
      chats,
      hasMoreData: Boolean(totalCount),
    };
  }

  async createSharedspaceChat(
    dto: SendSharedspacechatDTO,
    UserId: string,
  ) {
    const { url, ChatId, content, imageIds, imageKeys } = dto;

    const space = await this.sharedspaceFetcher.getSpaceByUrl(url);

    if (!space) {
      throw new WsException({
        type: ERROR_TYPE.BAD_REQUEST_ERROR,
        message: BAD_REQUEST_MESSAGE,
      });
    }

    const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

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
        SpaceId: space.id,
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
    const { url, ChatId, content } = dto;

    try {
      const space = await this.sharedspaceFetcher.getSpaceByUrl(url);

      const updatedAt = dayjs().toDate();

      const result = await this.chatsRepository.update(
        {
          id: ChatId,
          SenderId: UserId,
          SpaceId: space.id,
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

    const { url, ChatId } = dto;

    try {
      const space = await this.sharedspaceFetcher.getSpaceByUrl(url);

      const targetChat = await this.chatsRepository.findOne({
        select: {
          id: true,
          SenderId: true,
          SpaceId: true,
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
        targetChat?.SpaceId !== space.id
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
    const { url, ChatId, ImageId } = dto;
    const space = await this.sharedspaceFetcher.getSpaceByUrl(url);

    const targetChat = await this.chatsRepository.findOne({
      select: {
        id: true,
        SenderId: true,
        SpaceId: true,
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
      targetChat?.SpaceId !== space.id ||
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
    url: string,
    dto: GeneratePresignedPutUrlDTO,
  ) {
    const { metaDatas } = dto;

    if (metaDatas.length > 6) {
      throw new BadRequestException(CHAT_IMAGE_TOO_MANY_MESSAGE);
    }

    const batch = metaDatas.map(async (metaData) => {
      const { id, fileName, fileSize, contentType } = metaData;

      if (fileSize >= 5 * 1024 * 1024) {
        throw new BadRequestException(CHAT_IMAGE_TOO_LARGE_MESSAGE);
      }
      
      const key = this.storageR2Service.generateStorageKey(url, fileName);
      const presignedUrl = await this.storageR2Service.generatePresignedPutUrl(key, contentType);
      await this.imagesRepository.insert({ id, status: IMAGE_STATUS.PENDING, type: IMAGE_TYPE.CHAT });

      return {
        key,
        presignedUrl,
        contentType,
      };
    })

    const keyAndUrls = await Promise.all(batch);

    return keyAndUrls;
  }

  async getChatspaceChats(
    url: string,
    beforeChatId: string,
    UserId: string,
    limit = 100,
  ) {
    const space = await this.sharedspaceFetcher.getSpaceByUrl(url);

    if (!space) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const isParticipant = await this.rolesService.requireParticipant(UserId, space.id);

    if (!isParticipant) {
      throw new ForbiddenException({
        message: ACCESS_DENIED_MESSAGE,
        metaData: { spaceUrl: space.url },
      });
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
        SpaceId: space.id,
        id: LessThan(beforeChatId),
        removedAt: IsNull(),
      } : {
        SpaceId: space.id,
        removedAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });

    if (!chatRecords.length) {
      return {
        chats: [],
        hasMoreData: false,
      };
    }

    const result = await this.chatImagesRepository.find({
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

    const imagesMap = result.reduce((acc, image) => {
      const { ChatId } = image;

      if (!acc[ChatId]) {
        acc[ChatId] = [];
      }

      acc[ChatId].push({ id: image.id, path: image.path });
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

    const totalCount = await this.chatsRepository.count({
      where: {
        SpaceId: space.id,
        id: LessThan(chats[chats.length-1].id),
        removedAt: IsNull(),
      },
    });

    return {
      chats,
      hasMoreData: Boolean(totalCount),
    };
  }
}