import path from "path";
import { BadRequestException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE } from "src/common/constant/error.message";
import handleError from "src/common/function/handleError";
import { Chats } from "src/entities/Chats";
import { Images } from "src/entities/Images";
import { EventsGateway } from "src/events/events.gateway";
import { RolesService } from "src/roles/roles.service";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { DataSource, In, LessThan, Repository } from "typeorm";
import { ChatsCommandList, IStorageService, STORAGE_SERVICE } from "src/typings/types";
import { CreateSharedspaceChatDTO } from "./dto/create.sharedspace.chat.dto";
import { UpdateSharedspaceChatDTO } from "./dto/update.sharedspace.chat.dto";
import { Sharedspaces } from "src/entities/Sharedspaces";

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
    @Inject(STORAGE_SERVICE)
    private storageService: IStorageService,
    private sharedspacesService: SharedspacesService,
  ) {}

  async getSharedspaceChats(
    url: string,
    beforeChatId: number,
    UserId?: number,
    limit = 100,
  ) {
    try {
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
            profileImage: true,
          },
        },
        relations: {
          Sender: true,
        },
        where: beforeChatId ? {
          SharedspaceId: space.id,
          id: LessThan(beforeChatId),
        } : {
          SharedspaceId: space.id,
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
          path: true,
          ChatId: true,
        },
        where: {
          ChatId: In(chatRecords.map((chat) => chat.id)),
        },
      });

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
        hasMoreData: totalCount,
      };
    } catch (err) {
      handleError(err);
    }
  }

  async createSharedspaceChat(
    url: string,
    dto: CreateSharedspaceChatDTO,
    files: Express.Multer.File[],
    UserId: number,
  ) {
    const { content } = dto;
    let folderName = process.env.STORAGE_PROVIDER === 's3' ?
      process.env.AWS_S3_FOLDER_NAME :
      process.env.OCI_FOLDER_NAME;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      if (!space) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const chatRecord = await qr.manager.save(Chats, {
        content,
        SenderId: UserId,
        SharedspaceId: space.id,
      });

      for (let i=0; i<files.length; i++) {
        const key = `${folderName}/${Date.now()}${path.extname(files[i].originalname)}`;

        await qr.manager.save(Images, { path: key, ChatId: chatRecord.id })
          .then(async () => {
            await this.storageService.uploadFile(files[i], key);
          });
      }

      await qr.commitTransaction();
      await qr.release();

      const chatWithUser = await this.chatsRepository.findOne({
        select: {
          id: true,
          content: true,
          SenderId: true,
          createdAt: true,
          updatedAt: true,
          Sender: {
            email: true,
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
          id: chatRecord.id,
        },
      });

      this.eventsGateway.server
        .to(`/sharedspace-${space.url}`)
        .emit(`publicChats:${ChatsCommandList.CHAT_CREATED}`, chatWithUser);
    } catch (err) {
      if (!qr.isReleased) {
        await qr.rollbackTransaction();
        await qr.release();
      }

      for (let i=0; i<files.length; i++) {
        const key = `${folderName}/${Date.now()}${path.extname(files[i].originalname)}`;

        await this.storageService.deleteFile(key);
      }

      handleError(err);
    }

    return true;
  }

  async updateSharedspaceChat(
    url: string,
    dto: UpdateSharedspaceChatDTO,
    UserId: number,
  ) {
    const { ChatId, content } = dto;

    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);
      const targetChat = await this.chatsRepository.findOneBy({ id: ChatId });

      if (
        targetChat?.SenderId !== UserId ||
        targetChat?.SharedspaceId !== space.id
      ) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      await this.chatsRepository.update({ id: ChatId }, { content });

      const chatWithUser = await this.chatsRepository.findOne({
        select: {
          id: true,
          content: true,
          SenderId: true,
          createdAt: true,
          updatedAt: true,
          Sender: {
            email: true,
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
          id: ChatId,
        },
      });

      this.eventsGateway.server
        .to(`/sharedspace-${space.url}`)
        .emit(`publicChats:${ChatsCommandList.CHAT_UPDATED}`, chatWithUser);
    } catch (err) {
      handleError(err);
    }
  };

  async deleteSharedspaceChat(
    url: string,
    ChatId: number,
    UserId: number,
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

      for (let i=0; i<targetChat.Images.length; i++) {
        const image = targetChat.Images[i];

        await qr.manager.delete(Images, { id: image.id })
          .then(async () => {
            await this.storageService.deleteFile(image.path);
          });
      }

      await qr.manager.delete(Chats, { id: ChatId });

      await qr.commitTransaction();
      await qr.release();

      this.eventsGateway.server
        .to(`/sharedspace-${space.url}`)
        .emit(`publicChats:${ChatsCommandList.CHAT_DELETED}`, ChatId);
    } catch (err) {
      if (!qr.isReleased) {
        await qr.rollbackTransaction();
        await qr.release();
      }

      handleError(err);
    }
  }

  async deleteSharedspaceChatImage(
    url: string,
    ChatId: number,
    ImageId: number,
    UserId: number,
  ) {
    try {
      const space = await this.sharedspacesService.getSharedspaceByUrl(url);

      const targetChat = await this.chatsRepository.findOne({
        select: {
          id: true,
          SenderId: true,
          SharedspaceId: true,
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
          Images: {
            id: ImageId,
          },
        },
      });

      if (
        targetChat?.SenderId !== UserId ||
        targetChat?.SharedspaceId !== space.id
      ) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      await this.imagesRepository.delete({ id: ImageId })
        .then(async () => {
          await this.storageService.deleteFile(targetChat.Images[0].path);
        });

      this.eventsGateway.server
        .to(`/sharedspace-${space.url}`)
        .emit(`publicChats:${ChatsCommandList.CHAT_IMAGE_DELETED}`, ChatId, ImageId);
    } catch (err) {
      handleError(err);
    }
  }
}