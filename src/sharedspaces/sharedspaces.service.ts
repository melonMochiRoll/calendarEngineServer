import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CreateSharedspaceDTO } from "./dto/create.sharedspace.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { nanoid } from "nanoid";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { ChatsCommandList, SharedspaceMembersRoles, SubscribedspacesSorts } from "src/typings/types";
import { Users } from "src/entities/Users";
import { ACCESS_DENIED_MESSAGE, BAD_REQUEST_MESSAGE, CONFLICT_MESSAGE, INTERNAL_SERVER_MESSAGE, NOT_FOUND_RESOURCE } from "src/common/constant/error.message";
import { CreateSharedspaceMembersDTO } from "./dto/create.sharedspace.members.dto";
import { UpdateSharedspaceMembersDTO } from "./dto/update.sharedspace.members.dto";
import handleError from "src/common/function/handleError";
import { UpdateSharedspacePrivateDTO } from "./dto/update.sharedspace.private.dto";
import { Roles } from "src/entities/Roles";
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
    @InjectRepository(Roles)
    private rolesRepository: Repository<Roles>,
    @InjectRepository(Chats)
    private chatsRepository: Repository<Chats>,
    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
    private readonly eventsGateway: EventsGateway,
    private awsService: AwsService,
    private rolesService: RolesService,
  ) {}

  async getSharedspaceByUrl(url: string, columns?: string[]) {
    const cacheKey = `sharedspace:${url}:${columns.join(',')}`;

    const cashedSpace = await this.cacheManager.get<Sharedspaces>(cacheKey);

    if (cashedSpace) {
      return cashedSpace;
    }

    try {
      const selectClause = Object.fromEntries(columns.map(column => [column, true]));

      const space = await this.sharedspacesRepository.findOne({
        select: selectClause,
        where: {
          url,
        },
      });

      if (space) {
        const minute = 60000;
        await this.cacheManager.set(cacheKey, space, 10 * minute);
      }

      return space;
    } catch (err) {
      handleError(err);
    }
  }

  async getSharedspace(
    url: string,
    UserId?: number,
  ) {
    try {
      const space = await this.getSharedspaceByUrl(url, ['id', 'name', 'url', 'private']);

      if (!space) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      const roleIdMap = await this.rolesService.getRoleMap();
      const userRole = await this.rolesService.getUserRole(UserId, space.id);

      const isOwner = space.OwnerId === UserId;
      const isMember = isOwner || roleIdMap['member'] === userRole?.RoleId;
      const isViewer = isOwner || isMember || roleIdMap['viewer'] === userRole?.RoleId

      return {
        ...space,
        permission: {
          isOwner,
          isMember,
          isViewer,
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
      const roleIdMap = await this.rolesService.getRoleMap();

      const RoleId = roleIdMap[SharedspaceMembersRoles.OWNER];
      Object.assign(whereCondition, { RoleId });
    }

    if (sort === SubscribedspacesSorts.UNOWNED) {
      const roleIdMap = await this.rolesService.getRoleMap();

      const roleIdsWithoutOwner = Object
        .entries(roleIdMap)
        .filter((role: [string, number]) => role[0] !== SharedspaceMembersRoles.OWNER)
        .map((role: [string, number]) => role[1]);
      
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

    const s3Keys = files.map((file) => `${process.env.AWS_S3_FOLDER_NAME}/${Date.now()}${path.extname(file.originalname)}`);

    try {
      const chat = await qr.manager.save(Chats, {
        content,
        SenderId: user.id,
        SharedspaceId: targetSpace.id,
      });

      for (let i=0; i<files.length; i++) {
        const key = s3Keys[i];

        await qr.manager.save(Images, { path: key, ChatId: chat.id })
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
          id: ChatId,
        },
      });

      this.eventsGateway.server
        .to(`/sharedspace-${targetSpace.url}`)
        .emit(`publicChats:${ChatsCommandList.CHAT_UPDATED}`, chatWithUser);
    } catch (err) {
      handleError(err);
    }
  };

  async deleteSharedspaceChat(
    targetSpace: Sharedspaces,
    ChatId: number,
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
          id: ChatId,
        },
      });

      if (targetChat.SenderId !== user.id || targetChat.SharedspaceId !== targetSpace.id) {
        throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
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
        .to(`/sharedspace-${targetSpace.url}`)
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

      await this.imagesRepository.delete({ id: ImageId })
        .then(async () => {
          await this.awsService.deleteImageFromS3(targetChat.Images[0].path);
        });

      this.eventsGateway.server
        .to(`/sharedspace-${targetSpace.url}`)
        .emit(`publicChats:${ChatsCommandList.CHAT_IMAGE_DELETED}`, ChatId, ImageId);
    } catch (err) {
      handleError(err);
    }
  }
}