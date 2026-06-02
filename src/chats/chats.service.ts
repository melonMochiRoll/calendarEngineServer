import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CHAT_IMAGE_TOO_LARGE_MESSAGE, CHAT_IMAGE_TOO_MANY_MESSAGE } from "src/common/constant/error.message";
import { Chats } from "src/entities/Chats";
import { Images } from "src/entities/Images";
import { RolesService } from "src/roles/roles.service";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { DataSource, In, IsNull, LessThan, Repository } from "typeorm";
import dayjs from "dayjs";
import { GeneratePresignedPutUrlDTO } from "./dto/generate.presigned.put.url.dto";
import { ChatToClient, IMAGE_STATUS, IMAGE_TYPE, SHAREDSPACE_ROLE, SPACE_TYPE, SPACE_URL_LENGTH } from "src/common/constant/constants";
import { StorageR2Service } from "src/storage/storage.r2.service";
import { SendSharedspacechatDTO } from "src/chats/dto/send.sharedspace.chat.dto";
import { UpdateSharedspaceChatDTO } from "src/chats/dto/update.sharedspace.chat.dto";
import { DeleteSharedspaceChatDTO } from "src/chats/dto/delete.sharedspace.chat.dto";
import { DeleteSharedspaceChatImageDTO } from "src/chats/dto/delete.sharedspace.chat.image.dto";
import { ChatImages } from "src/entities/ChatImages";
import { getR2PublicURL } from "src/common/function/getStorageURL";
import { Spaces } from "src/entities/Spaces";
import { uuidv7 } from "node_modules/uuidv7/dist/index.cjs";
import { nanoid } from "nanoid";
import { ChatSpaces } from "src/entities/ChatSpaces";
import { SpaceMembers } from "src/entities/SpaceMembers";
import { CreatChatspaceDTO } from "./dto/create.chatspace.dto";

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
          ProfileImage: {
            id: true,
            Image: {
              path: true,
            },
          },
        },
      },
      relations: {
        Sender: {
          ProfileImage: {
            Image: true,
          },
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
        Image: {
          path: true,
        },
      },
      where: {
        ChatId: In(chatRecords.map((chat) => chat.id)),
        Image: {
          status: IMAGE_STATUS.ACTIVE,
          removedAt: IsNull(),
        },
      },
      relations: {
        Image: true,
      },
    });

    const images = result.map((image) => {
      const { Image, ...rest } = image;
      return {
        ...rest,
        path: `${getR2PublicURL()}/${Image.path}`,
      };
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
        ChatImages: imagesMap[`${chat.id}`] || [],
        Sender: {
          ...chat.Sender,
          ProfileImage: chat.Sender.ProfileImage ? `${getR2PublicURL()}/${chat.Sender.ProfileImage?.Image?.path}`: '',
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
    const { url, id, content, imageIds } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const space = await this.sharedspacesService.getSpaceByUrl(url);

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
        SpaceId: space.id,
      });

      if (imageIds.length) {
        const updatePromises = imageIds.map(async (imageId) => {
          await qr.manager.update(Images, { id: imageId }, { status: IMAGE_STATUS.ACTIVE });
          await qr.manager.insert(ChatImages, { id: imageId, ChatId: id });
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
              Image: {
                path: true,
              },
            },
          },
          ChatImages: {
            id: true,
            Image: {
              path: true,
            }
          },
        },
        relations: {
          Sender: {
            ProfileImage: {
              Image: true,
            },
          },
          ChatImages: {
            Image: true,
          },
        },
        where: {
          id,
        },
      });

      const getPublicUrlAndFlattening = result.ChatImages.map((chatImage) => {
        const { Image, ...rest } = chatImage;
        return {
          ...rest,
          path: `${getR2PublicURL()}/${Image.path}`,
        };
      });
      const chatWithUser = {
        ...result,
        Sender: {
          ...result.Sender,
          ProfileImage: result.Sender.ProfileImage ? `${getR2PublicURL()}/${result.Sender.ProfileImage?.Image?.path}` : '',
        },
        ChatImages: getPublicUrlAndFlattening,
      };

      return {
        sender: Object.assign({ ...chatWithUser }, { permission: { isSender: true } }),
        receiver: Object.assign({ ...chatWithUser }, { permission: { isSender: false } }),
      };
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async updateSharedspaceChat(
    dto: UpdateSharedspaceChatDTO,
    UserId: string,
  ) {
    const { url, id, content } = dto;

    const space = await this.sharedspacesService.getSpaceByUrl(url);

    const updatedAt = dayjs().toDate();

    const result = await this.chatsRepository.update(
      {
        id,
        SenderId: UserId,
        SpaceId: space.id,
      },
      {
        content,
        updatedAt,
      }
    );

    if (!result.affected) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    return { id, content, updatedAt };
  };

  async deleteSharedspaceChat(
    dto: DeleteSharedspaceChatDTO,
    UserId: string,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const { url, id } = dto;

    try {
      const space = await this.sharedspacesService.getSpaceByUrl(url);

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
          id,
        },
      });

      if (
        targetChat?.SenderId !== UserId ||
        targetChat?.SpaceId !== space.id
      ) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const now = dayjs().toDate();

      const softDeletePromises = targetChat.ChatImages.map(chatImage =>
        qr.manager.update(Images, { id: chatImage.id }, { status: IMAGE_STATUS.DELETED, removedAt: now })
      );
      await Promise.all(softDeletePromises);

      await qr.manager.update(Chats, { id: targetChat.id }, { removedAt: now });

      await qr.commitTransaction();

      return id;
    } catch (err) {
      await qr.rollbackTransaction();

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
    const space = await this.sharedspacesService.getSpaceByUrl(url);

    const result = await this.chatsRepository.findOne({
      select: {
        id: true,
        SenderId: true,
        SpaceId: true,
        content: true,
        ChatImages: {
          id: true,
          Image: {
            path: true,
          },
        },
      },
      relations: {
        ChatImages: {
          Image: true,
        },
      },
      where: {
        id: ChatId,
      },
    });

    const targetChat = {
      ...result,
      ChatImages: result.ChatImages.map(chatImage => {
        const { Image, ...rest } = chatImage;
        return {
          ...rest,
          path: Image.path,
        };
      }),
    };

    if (
      targetChat?.SenderId !== UserId ||
      targetChat?.SpaceId !== space.id ||
      !targetChat.ChatImages.find(chatImage => chatImage.id === ImageId)
    ) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
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
        action: ChatToClient.CHAT_IMAGE_DELETED,
        data: { ChatId, ImageId },
      };
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
      await this.imagesRepository.insert({ id, status: IMAGE_STATUS.PENDING, path: key, type: IMAGE_TYPE.CHAT });

      return {
        presignedUrl,
        contentType,
      };
    })

    const keyAndUrls = await Promise.all(batch);

    return keyAndUrls;
  }

  async createChatSpace(
    UserId: string,
    dto: CreatChatspaceDTO,
  ) {
    const { targetUserId } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const SpaceId = uuidv7();
      const url = nanoid(SPACE_URL_LENGTH);

      await qr.manager.insert(Spaces, {
        id: SpaceId,
        url,
        type: SPACE_TYPE.CHAT,
      });
      await qr.manager.insert(ChatSpaces, { id: SpaceId });

      const memberInfo = await this.rolesService.getRoleInfo(SHAREDSPACE_ROLE.MEMBER);
      
      await qr.manager.insert(SpaceMembers, {
        id: uuidv7(),
        UserId,
        SpaceId,
        RoleId: memberInfo.id,
      });

      await qr.manager.insert(SpaceMembers, {
        id: uuidv7(),
        UserId: targetUserId,
        SpaceId,
        RoleId: memberInfo.id,
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