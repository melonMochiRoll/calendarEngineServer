import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { CreateSharedspaceDTO } from "./dto/create.sharedspace.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { nanoid } from "nanoid";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { ChatsCommandList, SharedspaceMembersRoles, SharedspaceReturnMap, SubscribedspacesSorts } from "src/typings/types";
import { Users } from "src/entities/Users";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CONFLICT_MESSAGE, CONFLICT_OWNER_MESSAGE, NOT_FOUND_RESOURCE, UNAUTHORIZED_MESSAGE } from "src/common/constant/error.message";
import { CreateSharedspaceMembersDTO } from "./dto/create.sharedspace.members.dto";
import { UpdateSharedspaceMembersDTO } from "./dto/update.sharedspace.members.dto";
import handleError from "src/common/function/handleError";
import { UpdateSharedspacePrivateDTO } from "./dto/update.sharedspace.private.dto";
import { Chats } from "src/entities/Chats";
import { CreateSharedspaceChatDTO } from "./dto/create.sharedspace.chat.dto";
import { EventsGateway } from "src/events/events.gateway";
import { Images } from "src/entities/Images";
import { UpdateSharedspaceChatDTO } from "./dto/update.sharedspace.chat.dto";
import { AwsService } from "src/aws/aws.service";
import path from "path";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { RolesService } from "src/roles/roles.service";

@Injectable()
export class SharedspacesService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private dataSource: DataSource,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembersRepository: Repository<SharedspaceMembers>,
    @InjectRepository(Chats)
    private chatsRepository: Repository<Chats>,
    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
    private readonly eventsGateway: EventsGateway,
    private awsService: AwsService,
    private rolesService: RolesService,
  ) {}

  async getSharedspaceByUrl<T extends 'full' | 'standard' = 'standard'>(
    url: string,
    columnGroup?: T,
  ): Promise<SharedspaceReturnMap<T>> {
    const cacheKey = `sharedspace:${url}:${columnGroup}`;

    const cachedSpace = await this.cacheManager.get<SharedspaceReturnMap<T>>(cacheKey);

    if (cachedSpace) {
      return cachedSpace;
    }

    const selectClause = columnGroup === 'full' ?
      {} :
      {
        id: true,
        name: true,
        url: true,
        private: true,
        createdAt: true,
        OwnerId: true,
      };

    try {
      const space = await this.sharedspacesRepository.findOne({
        select: selectClause,
        where: {
          url,
        },
      }) as SharedspaceReturnMap<T>;

      if (!space) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const minute = 60000;
      await this.cacheManager.set(cacheKey, space, 10 * minute);

      return space;
    } catch (err) {
      handleError(err);
    }
  }

  async invalidateSharedspaceCache(url: string) {
    await this.cacheManager.del(`sharedspace:${url}:full`);
    await this.cacheManager.del(`sharedspace:${url}:standard`);
  }

  async getSharedspace(
    url: string,
    UserId?: number,
  ) {
    try {
      const space = await this.getSharedspaceByUrl(url);

      if (!UserId) {
        if (space.private) {
          throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
        }
        
        return {
          ...space,
          permission: {
            isOwner: false,
            isMember: false,
            isViewer: true,
          },
        };
      }

      const userRole = await this.rolesService.requireParticipant(UserId, space.id);

      if (!userRole && space.private) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      const isOwner = space.OwnerId === UserId;
      const isMember = isOwner || userRole?.name === SharedspaceMembersRoles.MEMBER;

      return {
        ...space,
        permission: {
          isOwner,
          isMember,
          isViewer: true,
        },
      };
    } catch (err) {
      handleError(err);
    }
  }

  async getSubscribedspaces(
    sort: string,
    UserId: number,
    page: number,
    limit = 7,
  ) {
    const whereCondition = {
      UserId,
    };

    if (sort === SubscribedspacesSorts.OWNED) {
      const rolesArray = await this.rolesService.getRolesArray();
      const ownerRole = rolesArray.find(role => role.name === SharedspaceMembersRoles.OWNER);

      Object.assign(whereCondition, { RoleId: ownerRole.id });
    }

    if (sort === SubscribedspacesSorts.UNOWNED) {
      const rolesArray = await this.rolesService.getRolesArray();
      const roleIdsWithoutOwner = rolesArray
        .filter(role => role.name !== SharedspaceMembersRoles.OWNER)
        .map(role => role.id);
      
      Object.assign(whereCondition, { RoleId: In(roleIdsWithoutOwner) });
    }

    try {
      const user_roles = await this.sharedspaceMembersRepository.find({
        select: {
          SharedspaceId: true,
        },
        where: whereCondition,
        order: {
          createdAt: 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      const subscribedspaces = await this.sharedspacesRepository.find({
        select: {
          name: true,
          url: true,
          private: true,
          OwnerId: true,
        },
        where: {
          id: In(user_roles.map((role) => role.SharedspaceId)),
        },
      });

      const owners = await this.usersRepository.find({
        select: {
          id: true,
          email: true,
        },
        where: {
          id: In(subscribedspaces.map((space) => space.OwnerId)),
        },
      });

      const owners_map = owners.reduce((obj, owner) => {
        obj[owner.id] = owner.email;
        return obj;
      }, {});

      const spaces = subscribedspaces.map((space) => {
        const { OwnerId, ...rest } = space;
        return {
          ...rest,
          owner: owners_map[space.OwnerId],
          permission: {
            isOwner: UserId === space.OwnerId,
          },
        };
      });

      const totalCount = await this.sharedspaceMembersRepository.count({
        where: whereCondition,
      });

      return { spaces, totalCount };
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

      const rolesArray = await this.rolesService.getRolesArray();
      const ownerRole = rolesArray.find(role => role.name === SharedspaceMembersRoles.OWNER);
      
      await qr.manager.save(SharedspaceMembers, {
        UserId: OwnerId,
        SharedspaceId: created.id,
        RoleId: ownerRole.id,
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
    url: string,
    dto: UpdateSharedspaceNameDTO,
    UserId: number,
  ) {
    const { name } = dto;
    
    try {
      const space = await this.getSharedspaceByUrl(url);

      const isOwner = await this.rolesService.requireOwner(UserId, space.id);

      if (!isOwner) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      if (space.name === name) {
        throw new ConflictException('동일한 이름으로 바꿀수 없습니다.');
      }

      await this.sharedspacesRepository.update({ id: space.id }, { name });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async updateSharedspaceOwner(
    url: string,
    dto: UpdateSharedspaceOwnerDTO,
    UserId: number,
  ) {
    const { OwnerId, newOwnerId } = dto;

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const space = await this.getSharedspaceByUrl(url);

      const isOwner = await this.rolesService.requireOwner(UserId, space.id);

      if (!isOwner) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      if (OwnerId !== UserId) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      if (space.OwnerId === newOwnerId) {
        throw new ConflictException(CONFLICT_OWNER_MESSAGE);
      }

      const rolesArray = await this.rolesService.getRolesArray();

      const { ownerRoleId, memberRoleId } = rolesArray.reduce((acc, role) => {
        if (role.name === SharedspaceMembersRoles.OWNER) {
          acc.ownerRoleId = role.id;
        }
        if (role.name === SharedspaceMembersRoles.MEMBER) {
          acc.memberRoleId = role.id;
        }

        return acc;
      }, { ownerRoleId: 0, memberRoleId: 0 });

      await qr.manager.update(Sharedspaces, { id: space.id }, { OwnerId: newOwnerId });
      await qr.manager.update(SharedspaceMembers, { UserId: OwnerId, SharedspaceId: space.id }, { RoleId: memberRoleId });
      await qr.manager.save(SharedspaceMembers, { UserId: newOwnerId, SharedspaceId: space.id, RoleId: ownerRoleId });

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
    url: string,
    dto: UpdateSharedspacePrivateDTO,
    UserId: number,
  ) {
    try {
      const space = await this.getSharedspaceByUrl(url);

      const isOwner = await this.rolesService.requireOwner(UserId, space.id);

      if (!isOwner) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      await this.sharedspacesRepository.update({ id: space.id }, { ...dto });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async deleteSharedspace(
    url: string,
    UserId: number,
  ) {
    try {
      const space = await this.getSharedspaceByUrl(url);

      const isOwner = await this.rolesService.requireOwner(UserId, space.id);

      if (!isOwner) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      await this.sharedspacesRepository.softRemove(space);
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async createSharedspaceMembers(
    url: string,
    dto: CreateSharedspaceMembersDTO,
    UserId: number,
  ) {
    const { UserId: targetUserId, RoleName } = dto;

    try {
      const space = await this.getSharedspaceByUrl(url);

      const isOwner = await this.rolesService.requireOwner(UserId, space.id);

      if (!isOwner) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      const rolesArray = await this.rolesService.getRolesArray();
      const role = rolesArray.find(role => role.name === RoleName);

      if (!role || role.name === SharedspaceMembersRoles.OWNER) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const isMember = await this.sharedspaceMembersRepository.findOne({
        select: {
          RoleId: true,
        },
        where: {
          UserId: targetUserId,
          SharedspaceId: space.id,
        },
      });

      if (isMember) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      await this.sharedspaceMembersRepository.save({
        UserId: targetUserId,
        SharedspaceId: space.id,
        RoleId: role.id,
      });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async updateSharedspaceMembers(
    url: string,
    dto: UpdateSharedspaceMembersDTO,
    UserId: number,
  ) {
    const { UserId: targetUserId, RoleName } = dto;

    try {
      const space = await this.getSharedspaceByUrl(url);

      const isOwner = await this.rolesService.requireOwner(UserId, space.id);

      if (!isOwner) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      const rolesArray = await this.rolesService.getRolesArray();
      const role = rolesArray.find(role => role.name === RoleName);

      if (!role || role.name === SharedspaceMembersRoles.OWNER) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const isMember = await this.sharedspaceMembersRepository.findOne({
        select: {
          RoleId: true,
        },
        where: {
          UserId: targetUserId,
          SharedspaceId: space.id,
        }
      });

      if (!isMember) {
        throw new NotFoundException(NOT_FOUND_RESOURCE);
      }

      await this.sharedspaceMembersRepository.update({
        UserId: targetUserId,
        SharedspaceId: space.id,
      },{
        RoleId: role.id,
      });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async deleteSharedspaceMembers(
    url: string,
    targetUserId: number,
    UserId: number,
  ) {
    try {
      const space = await this.getSharedspaceByUrl(url);

      const isOwner = await this.rolesService.requireOwner(UserId, space.id);

      if (!isOwner) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
      }

      const isMember = await this.sharedspaceMembersRepository.findOne({
        select: {
          RoleId: true
        },
        where: {
          UserId: targetUserId,
          SharedspaceId: space?.id,
        }
      });

      const rolesArray = await this.rolesService.getRolesArray();
      const role = rolesArray.find(role => role.id === isMember.RoleId);

      if (!isMember || role.name === SharedspaceMembersRoles.OWNER) {
        throw new NotFoundException(NOT_FOUND_RESOURCE);
      }

      await this.sharedspaceMembersRepository.delete({
        UserId: targetUserId,
        SharedspaceId: space.id,
      });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async getSharedspaceChats(
    url: string,
    page: number,
    UserId?: number,
    limit = 30,
  ) {
    try {
      const space = await this.getSharedspaceByUrl(url);

      if (!space) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
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
        where: {
          SharedspaceId: space.id,
        },
        order: {
          createdAt: 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      const images = await this.imagesRepository.find({
        select: {
          id: true,
          path: true,
        },
        where: {
          ChatId: In(chatRecords.map((chat) => chat.id)),
        },
      });

      const imagesMap = images.reduce((acc, image) => {
        if (!acc[image.id]) {
          acc[image.id] = [];
        }
        acc[image.id].push(image);
        return acc;
      }, {});

      const chats = chatRecords.map((chat) => {
        return {
          ...chat,
          Images: imagesMap[chat.id] || [],
          permission: {
            isSender: chat.SenderId === UserId,
          },
        };
      });

      const totalCount = await this.chatsRepository.count({
        where: {
          SharedspaceId: space.id,
        },
      });

      return {
        chats,
        hasMoreData: !Boolean(page * limit >= totalCount),
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

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    const s3Keys = files.map((file) => `${process.env.AWS_S3_FOLDER_NAME}/${Date.now()}${path.extname(file.originalname)}`);

    try {
      const space = await this.getSharedspaceByUrl(url);

      if (!space) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const chatRecord = await qr.manager.save(Chats, {
        content,
        SenderId: UserId,
        SharedspaceId: space.id,
      });

      for (let i=0; i<files.length; i++) {
        const key = s3Keys[i];

        await qr.manager.save(Images, { path: key, ChatId: chatRecord.id })
          .then(async () => {
            await this.awsService.uploadImageToS3(files[i], key);
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

      for (let i=0; i<s3Keys.length; i++) {
        await this.awsService.deleteImageFromS3(s3Keys[i]);
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
      const space = await this.getSharedspaceByUrl(url);
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
      const space = await this.getSharedspaceByUrl(url);

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
            await this.awsService.deleteImageFromS3(image.path);
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
      const space = await this.getSharedspaceByUrl(url);

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
          await this.awsService.deleteImageFromS3(targetChat.Images[0].path);
        });

      this.eventsGateway.server
        .to(`/sharedspace-${space.url}`)
        .emit(`publicChats:${ChatsCommandList.CHAT_IMAGE_DELETED}`, ChatId, ImageId);
    } catch (err) {
      handleError(err);
    }
  }
}