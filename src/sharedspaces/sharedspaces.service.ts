import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CreateSharedspaceDTO } from "./dto/create.sharedspace.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Equal, IsNull, Or, Repository } from "typeorm";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { nanoid } from "nanoid";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { SharedspaceMembersRoles, SubscribedspacesFilter, TSubscribedspacesFilter } from "src/typings/types";
import { Users } from "src/entities/Users";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CONFLICT_MESSAGE, INTERNAL_SERVER_MESSAGE, NOT_FOUND_RESOURCE, NOT_FOUND_SPACE_MESSAGE } from "src/common/constant/error.message";
import { CreateSharedspaceMembersDTO } from "./dto/create.sharedspace.members.dto";
import { UpdateSharedspaceMembersDTO } from "./dto/update.sharedspace.members.dto";
import handleError from "src/common/function/handleError";
import { UpdateSharedspacePrivateDTO } from "./dto/update.sharedspace.private.dto";
import { Roles } from "src/entities/Roles";
import { Chats } from "src/entities/Chats";
import { CreateSharedspaceChatDTO } from "./dto/create.sharedspace.chat.dto";
import { EventsGateway } from "src/events/events.gateway";
import { Images } from "src/entities/Images";
import fs from 'fs';
import { UpdateSharedspaceChatDTO } from "./dto/update.sharedspace.chat.dto";

@Injectable()
export class SharedspacesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembersRepository: Repository<SharedspaceMembers>,
    @InjectRepository(Roles)
    private rolesRepository: Repository<Roles>,
    @InjectRepository(Chats)
    private chatsRepository: Repository<Chats>,
    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async getSharedspace(url: string) {
    try {
      return await this.sharedspacesRepository.findOne({
        select: {
          id: true,
          name: true,
          url: true,
          private: true,
          Owner: {
            id: true,
            email: true,
          },
          Sharedspacemembers: {
            UserId: true,
            createdAt: true,
            Role: {
              name: true,
            },
            User: {
              email: true,
              profileImage: true,
            }
          },
        },
        relations: {
          Owner: true,
          Sharedspacemembers: {
            User: true,
            Role: true,
          },
        },
        where: {
          url,
        },
        order: {
          Sharedspacemembers: {
            createdAt: 'ASC',
          },
        }
      });
    } catch (err) {
      handleError(err);
    }
  }

  async getSubscribedspaces(
    filter: TSubscribedspacesFilter,
    user: Users,
  ) {
    const whereCondition = {
      UserId: user.id,
    };

    if (filter === SubscribedspacesFilter.OWNED) {
      Object.assign(whereCondition, { Role: { name: SharedspaceMembersRoles.OWNER } });
    }

    if (filter === SubscribedspacesFilter.UNOWNED) {
      const result =
        Object
          .values(SharedspaceMembersRoles)
          .filter(RoleName => RoleName !== SharedspaceMembersRoles.OWNER)
          .map(RoleName => Equal(RoleName));

      Object.assign(whereCondition, { Role: { name: Or(...result) } });
    }

    try {
      return await this.sharedspaceMembersRepository.find({
        select: {
          UserId: true,
          SharedspaceId: true,
          RoleId: true,
          createdAt: true,
          Sharedspace: {
            name: true,
            url: true,
            private: true,
            Owner: {
              email: true,
            },
          },
          Role: {
            name: true,
          },
        },
        relations: {
          Sharedspace: {
            Owner: true,
          },
          Role: true,
        },
        where: whereCondition,
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (err) {
      handleError(err);
    }
  }

  async createSharedspace(dto: CreateSharedspaceDTO) {
    const { OwnerId } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const created = await qr.manager.save(Sharedspaces, {
        url: nanoid(5),
        ...dto,
      });

      const owner = await this.rolesRepository.findOneBy({ name: SharedspaceMembersRoles.OWNER });

      if (!owner) {
        throw new InternalServerErrorException(INTERNAL_SERVER_MESSAGE);
      }
      
      await qr.manager.save(SharedspaceMembers, {
        UserId: OwnerId,
        SharedspaceId: created.id,
        RoleId: owner.id,
      });

      await qr.commitTransaction();

      return created.url;
    } catch (err) {
      await qr.rollbackTransaction();

      handleError(err);
    } finally {
      await qr.release();
    }
  }

  async updateSharedspaceName(
    targetSpace: Sharedspaces,
    dto: UpdateSharedspaceNameDTO,
  ) {
    const { name } = dto;
    
    try {
      if (targetSpace.name === name) {
        throw new ConflictException('동일한 이름으로 바꿀수 없습니다.');
      }

      await this.sharedspacesRepository.update({ id: targetSpace.id }, { name });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async updateSharedspaceOwner(
    targetSpace: Sharedspaces,
    dto: UpdateSharedspaceOwnerDTO,
  ) {
    const { OwnerId, newOwnerId } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      if (targetSpace.OwnerId === newOwnerId) {
        throw new ConflictException('동일한 유저로 바꿀수 없습니다.');
      }

      const owner = await this.rolesRepository.findOneBy({ name: SharedspaceMembersRoles.OWNER });
      const member = await this.rolesRepository.findOneBy({ name: SharedspaceMembersRoles.MEMBER });

      await qr.manager.update(Sharedspaces, { id: targetSpace.id }, { OwnerId: newOwnerId });
      await qr.manager.update(SharedspaceMembers, { UserId: OwnerId, SharedspaceId: targetSpace.id }, { RoleId: member.id });
      await qr.manager.save(SharedspaceMembers, { UserId: newOwnerId, SharedspaceId: targetSpace.id, RoleId: owner.id });

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      handleError(err);
    } finally {
      await qr.release();
    }

    return true;
  }

  async updateSharedspacePrivate(
    targetSpace: Sharedspaces,
    dto: UpdateSharedspacePrivateDTO,
  ) {
    try {
      await this.sharedspacesRepository.update({ id: targetSpace.id }, { ...dto });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async deleteSharedspace(targetSpace: Sharedspaces) {
    try {
      await this.sharedspacesRepository.softRemove(targetSpace);
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async createSharedspaceMembers(
    targetSpace: Sharedspaces,
    dto: CreateSharedspaceMembersDTO,
  ) {
    const { UserId, RoleName } = dto;

    try {
      const role = await this.rolesRepository.findOneBy({ name: RoleName });

      if (!role) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const isMember = await this.sharedspaceMembersRepository.findOneBy({
        UserId,
        SharedspaceId: targetSpace.id,
      });

      if (isMember) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      await this.sharedspaceMembersRepository.save({
        UserId,
        SharedspaceId: targetSpace.id,
        RoleId: role.id,
      });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async updateSharedspaceMembers(
    targetSpace: Sharedspaces,
    dto: UpdateSharedspaceMembersDTO,
  ) {
    const { UserId, RoleName } = dto;

    try {
      if (RoleName === SharedspaceMembersRoles.OWNER) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      const role = await this.rolesRepository.findOneBy({ name: RoleName });

      if (!role) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const isMember = await this.sharedspaceMembersRepository.findOneBy({
        UserId,
        SharedspaceId: targetSpace.id,
      });

      if (!isMember) {
        throw new NotFoundException(NOT_FOUND_RESOURCE);
      }

      await this.sharedspaceMembersRepository.update({
        UserId,
        SharedspaceId: targetSpace.id,
      },{
        RoleId: role.id,
      });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async deleteSharedspaceMembers(
    targetSpace: Sharedspaces,
    UserId: number,
  ) {
    try {

      const isMember = await this.sharedspaceMembersRepository.findOneBy({
        UserId,
        SharedspaceId: targetSpace?.id,
      });

      if (!isMember) {
        throw new NotFoundException(NOT_FOUND_RESOURCE);
      }

      await this.sharedspaceMembersRepository.delete({
        UserId,
        SharedspaceId: targetSpace.id,
      });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async getSharedspaceChats(
    targetSpace: Sharedspaces,
    offset: number,
    limit: number,
  ) {
    try {
      const result = await this.chatsRepository.find({
        select: {
          id: true,
          content: true,
          SenderId: true,
          SharedspaceId: true,
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
          SharedspaceId: targetSpace.id,
        },
        order: {
          createdAt: 'DESC',
        },
        skip: (offset - 1) * limit,
        take: limit,
      });

      if (result.length < limit) {
        return {
          chats: result,
          hasMoreData: false,
        };
      }

      const count = await this.chatsRepository.count({
        where: {
          SharedspaceId: targetSpace.id,
        },
      });

      return {
        chats: result,
        hasMoreData: !Boolean((offset - 1) * limit >= count),
      };
    } catch (err) {
      handleError(err);
    }
  }

  async createSharedspaceChat(
    targetSpace: Sharedspaces,
    dto: CreateSharedspaceChatDTO,
    files: Express.Multer.File[],
    user: Users,
  ) {
    const { content } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const chat = await qr.manager.save(Chats, {
        content,
        SenderId: user.id,
        SharedspaceId: targetSpace.id,
      });

      for (let i=0; i<files.length; i++) {
        await qr.manager.save(Images, {
          path: files[i].path,
          ChatId: chat.id,
        });
      }

      await qr.commitTransaction();
      await qr.release();

      const chatWithUser = await this.chatsRepository.findOne({
        select: {
          id: true,
          content: true,
          SenderId: true,
          SharedspaceId: true,
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
          id: chat.id,
        },
      });

      this.eventsGateway.server
        .to(`/sharedspace-${targetSpace.url}`)
        .emit('publicChats', chatWithUser);
    } catch (err) {
      await qr.rollbackTransaction();
      await qr.release();

      handleError(err);
    }

    return true;
  }

  async updateSharedspaceChat(
    targetSpace: Sharedspaces,
    dto: UpdateSharedspaceChatDTO,
    user: Users,
  ) {
    const { ChatId, content } = dto;

    try {
      const targetChat = await this.chatsRepository.findOneBy({ id: ChatId });

      if (targetChat.SenderId !== user.id || targetChat.SharedspaceId !== targetSpace.id) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      await this.chatsRepository.update({ id: ChatId }, { content });

      return await this.chatsRepository.findOne({
        select: {
          id: true,
          content: true,
          SenderId: true,
          SharedspaceId: true,
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
    } catch (err) {
      handleError(err);
    }
  };

  async deleteSharedspaceChat(
    targetSpace: Sharedspaces,
    chatId: number,
    user: Users,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
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
          id: chatId,
        },
      });

      if (targetChat.SenderId !== user.id || targetChat.SharedspaceId !== targetSpace.id) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      targetChat.Images.map(async (image: Images) => {
        await qr.manager.delete(Images, { id: image.id });
        fs.unlinkSync(image.path);
      });

      await qr.manager.delete(Chats, { id: chatId });

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      handleError(err);
    } finally {
      await qr.release();
    }
  }

  async deleteSharedspaceChatImage(
    targetSpace: Sharedspaces,
    ChatId: number,
    ImageId: number,
    user: Users,
  ) {
    try {
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

      if (targetChat.SenderId !== user.id || targetChat.SharedspaceId !== targetSpace.id) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      await this.imagesRepository.delete({
        id: ImageId,
        ChatId,
      })
      .then(() => {
        fs.unlinkSync(targetChat.Images[0].path);
      });
    } catch (err) {
      handleError(err);
    }
  }
}