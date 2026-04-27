import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CHAT_IMAGE_TOO_LARGE_MESSAGE, CHAT_IMAGE_TOO_MANY_MESSAGE } from "src/common/constant/error.message";
import { Chats } from "src/entities/Chats";
import { Images } from "src/entities/Images";
import { EventsGateway } from "src/events/events.gateway";
import { RolesService } from "src/roles/roles.service";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { DataSource, In, IsNull, LessThan, Repository } from "typeorm";
import { CreateSharedspaceChatDTO } from "./dto/create.sharedspace.chat.dto";
import { UpdateSharedspaceChatDTO } from "./dto/update.sharedspace.chat.dto";
import { Sharedspaces } from "src/entities/Sharedspaces";
import dayjs from "dayjs";
import { GeneratePresignedPutUrlDTO } from "./dto/generate.presigned.put.url.dto";
import { CHAT_EVENT, IMAGE_STATUS } from "src/common/constant/constants";
import { StorageR2Service } from "src/storage/storage.r2.service";
import { uuidv7 } from "uuidv7";

@Injectable()
export class ChatsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Chats)
    private chatsRepository: Repository<Chats>,
    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
    private readonly eventsGateway: EventsGateway,
    private rolesService: RolesService,
    private storageR2Service: StorageR2Service,
    private sharedspacesService: SharedspacesService,
  ) {}

  async getSharedspaceChats(
    url: string,
    beforeChatId: string,
    UserId?: string,
    limit = 100,
  ) {
    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

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
          profileImage: true,
        },
      },
      relations: {
        Sender: true,
      },
      where: beforeChatId ? {
        SharedspaceId: space.id,
        id: LessThan(beforeChatId),
        removedAt: IsNull(),
      } : {
        SharedspaceId: space.id,
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

    const images = await this.imagesRepository.find({
      select: {
        id: true,
        path: true,
        ChatId: true,
      },
      where: {
        ChatId: In(chatRecords.map((chat) => chat.id)),
        status: IMAGE_STATUS.ACTIVE,
        removedAt: IsNull(),
      },
    });

    await Promise.all(
      images.map(async (image) => 
        image.path = await this.storageR2Service.generatePresignedGetUrl(image.path)
      )
    );

    const imagesMap = images.reduce((acc, image) => {
      if (!acc[image.ChatId]) {
        acc[image.ChatId] = [];
      }
      acc[image.ChatId].push(image);
      return acc;
    }, {});

    const chats = chatRecords.map((chat) => {
      return {
        ...chat,
        Images: imagesMap[`${chat.id}`] || [],
        permission: {
          isSender: chat.SenderId === UserId,
        },
      };
    });

    const totalCount = await this.chatsRepository.count({
      where: {
        SharedspaceId: space.id,
        id: LessThan(chats[chats.length-1].id),
      },
    });

    return {
      chats,
      hasMoreData: Boolean(totalCount),
    };
  }

  async createSharedspaceChat(
    url: string,
    dto: CreateSharedspaceChatDTO,
    UserId: string,
  ) {
    const { id, content, imageIds } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

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

      await qr.manager.insert(Chats, {
        id,
        content,
        SenderId: UserId,
        SharedspaceId: space.id,
      });

      if (imageIds.length) {
        const batch = imageIds.map(imageId =>
          qr.manager.update(Images,
            { id: imageId },
            {
              status: IMAGE_STATUS.ACTIVE,
              ChatId: id,
            })
        );

        await Promise.all(batch);
      }

      await qr.commitTransaction();

      const chatWithUser = await this.chatsRepository.findOne({
        select: {
          id: true,
          content: true,
          SenderId: true,
          createdAt: true,
          updatedAt: true,
          Sender: {
            email: true,
            nickname: true,
            profileImage: true,
          },
          Images: {
            id: true,
            path: true,
          },
        },
        relations: {
          Sender: true,
          Images: true,
        },
        where: {
          id,
        },
      });

      if (chatWithUser.Images.length) {
        await Promise.all(
          chatWithUser.Images.map(async (image) => {
            image.path = await this.storageR2Service.generatePresignedGetUrl(image.path);
          })
        );
      }

      this.eventsGateway.server
        .to(`/sharedspace-${space.url}`)
        .emit(`publicChats:${CHAT_EVENT.CHAT_CREATED}`, chatWithUser);

      return Object.assign(chatWithUser, { permission: { isSender: true } });
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async updateSharedspaceChat(
    url: string,
    dto: UpdateSharedspaceChatDTO,
    UserId: string,
  ) {
    const { ChatId, content } = dto;

    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const updatedAt = dayjs().toDate();

    const result = await this.chatsRepository.update(
      {
        id: ChatId,
        SenderId: UserId,
        SharedspaceId: space.id,
      },
      {
        content,
        updatedAt,
      }
    );

    if (!result.affected) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    this.eventsGateway.server
      .to(`/sharedspace-${space.url}`)
      .emit(`publicChats:${CHAT_EVENT.CHAT_UPDATED}`, { id: ChatId, content, updatedAt });
  };

  async deleteSharedspaceChat(
    url: string,
    ChatId: string,
    UserId: string,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      const targetChat = await this.chatsRepository.findOne({
        select: {
          id: true,
          SenderId: true,
          SharedspaceId: true,
          Images: true,
        },
        relations: {
          Images: true,
        },
        where: {
          id: ChatId,
        },
      });

      if (
        targetChat?.SenderId !== UserId ||
        targetChat?.SharedspaceId !== space.id
      ) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const now = dayjs().toDate();

      await Promise.all(
        targetChat.Images.map(
          image => qr.manager.update(Images, { id: image.id }, { status: IMAGE_STATUS.DELETED, removedAt: now })
        )
      );

      await qr.manager.update(Chats, { id: targetChat.id }, { removedAt: now });

      await qr.commitTransaction();

      this.eventsGateway.server
        .to(`/sharedspace-${space.url}`)
        .emit(`publicChats:${CHAT_EVENT.CHAT_DELETED}`, ChatId);
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async deleteSharedspaceChatImage(
    url: string,
    ChatId: string,
    ImageId: string,
    UserId: string,
  ) {
    const space = await this.sharedspacesService.getSharedspaceByUrl(url);

    const targetChat = await this.chatsRepository.findOne({
      select: {
        id: true,
        SenderId: true,
        SharedspaceId: true,
        content: true,
        Images: {
          id: true,
          path: true,
        },
      },
      relations: {
        Images: true,
      },
      where: {
        id: ChatId,
      },
    });

    if (
      targetChat?.SenderId !== UserId ||
      targetChat?.SharedspaceId !== space.id ||
      !targetChat.Images.find(image => image.id === ImageId)
    ) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const now = dayjs().toDate();

    try {
      if (targetChat.Images.length === 1 && !targetChat.content) {
        await qr.manager.update(Images, { id: ImageId }, { status: IMAGE_STATUS.DELETED, removedAt: now });
        await qr.manager.update(Chats, { id: targetChat.id }, { removedAt: now });

        await qr.commitTransaction();

        this.eventsGateway.server
          .to(`/sharedspace-${space.url}`)
          .emit(`publicChats:${CHAT_EVENT.CHAT_DELETED}`, ChatId);
        return;
      }

      await qr.manager.update(Images, { id: ImageId }, { status: IMAGE_STATUS.DELETED, removedAt: now });

      await qr.commitTransaction();

      this.eventsGateway.server
        .to(`/sharedspace-${space.url}`)
        .emit(`publicChats:${CHAT_EVENT.CHAT_IMAGE_DELETED}`, ChatId, ImageId);
    } catch (err) {
      await qr.rollbackTransaction();

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
      await this.imagesRepository.insert({ id, status: IMAGE_STATUS.PENDING, path: key });

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