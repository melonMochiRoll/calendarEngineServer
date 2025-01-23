import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { SharedspacesService } from "./sharedspaces.service";
import { CreateSharedspaceDTO } from "./dto/create.sharedspace.dto";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { OwnerOnlyRoles } from "src/common/decorator/owner.only.decorator";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { AuthRoleGuards } from "src/common/decorator/auth.role.decorator";
import { IsAuthenicatedGuard } from "src/auth/authGuard/local.auth.guard";
import { TSubscribedspacesFilter } from "src/typings/types";
import { SubscribedFilterValidationPipe } from "src/common/pipe/subscribedFilter.validation.pipe";
import { PublicSpaceGuard } from "src/common/guard/public.space.guard";
import { CreateSharedspaceMembersDTO } from "./dto/create.sharedspace.members.dto";
import { UpdateSharedspaceMembersDTO } from "./dto/update.sharedspace.members.dto";
import { UpdateSharedspacePrivateDTO } from "./dto/update.sharedspace.private.dto";
import { TransformSpacePipe } from "src/common/pipe/transform.space.pipe";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { CreateSharedspaceChatDTO } from "./dto/create.sharedspace.chat.dto";
import { FilesInterceptor } from "@nestjs/platform-express";
import { multerImageOptions } from "src/common/config/multer.image.options";
import { UpdateSharedspaceChatDTO } from "./dto/update.sharedspace.chat.dto";

@Controller('api/sharedspaces')
export class SharedspacesController {
  constructor(
    private sharedspacesService: SharedspacesService,
  ) {}

  @UseGuards(PublicSpaceGuard)
  @Get(':url/view')
  getSharedspace(
    @Param('url') url: string,
  ) {
    return this.sharedspacesService.getSharedspace(url);
  }

  @UseGuards(IsAuthenicatedGuard)
  @Get('subscribed')
  getSubscribedspaces(
    @Query('filter', SubscribedFilterValidationPipe) filter: TSubscribedspacesFilter,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getSubscribedspaces(filter, user);
  }

  @UseGuards(IsAuthenicatedGuard)
  @Post()
  createSharedspace(@Body() dto: CreateSharedspaceDTO) {
    return this.sharedspacesService.createSharedspace(dto);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Patch(':url/name')
  updateSharedspaceName(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: UpdateSharedspaceNameDTO,
  ) {
    return this.sharedspacesService.updateSharedspaceName(targetSpace, dto);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Patch(':url/owner')
  updateSharedspaceOwner(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: UpdateSharedspaceOwnerDTO,
  ) {
    return this.sharedspacesService.updateSharedspaceOwner(targetSpace, dto);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Patch(':url/private')
  updateSharedspacePrivate(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: UpdateSharedspacePrivateDTO,
  ) {
    return this.sharedspacesService.updateSharedspacePrivate(targetSpace, dto);
  }
  
  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @HttpCode(204)
  @Delete(':url')
  deleteSharedspace(@Param('url', TransformSpacePipe) targetSpace: Sharedspaces) {
    return this.sharedspacesService.deleteSharedspace(targetSpace);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Post(':url/members')
  createSharedspaceMembers(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: CreateSharedspaceMembersDTO,
  ) {
    return this.sharedspacesService.createSharedspaceMembers(targetSpace, dto);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Patch(':url/members')
  updateSharedspaceMembers(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: UpdateSharedspaceMembersDTO,
  ) {
    return this.sharedspacesService.updateSharedspaceMembers(targetSpace, dto);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Delete(':url/members/:id')
  deleteSharedspaceMembers(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Param('id', ParseIntPipe) UserId: number,
  ) {
    return this.sharedspacesService.deleteSharedspaceMembers(targetSpace, UserId);
  }

  @UseGuards(PublicSpaceGuard)
  @Get(':url/chats')
  getSharedspaceChats(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Query('offset', ParseIntPipe) offset: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.sharedspacesService.getSharedspaceChats(targetSpace, offset, limit);
  }

  @UseInterceptors(FilesInterceptor('images', 6, {
    limits: {
      fileSize: Number(process.env.MAX_CHAT_IMAGE_SIZE) * 1024 * 1024,
    },
  }))
  @UseGuards(PublicSpaceGuard)
  @Post(':url/chats')
  createSharedspaceChat(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: CreateSharedspaceChatDTO,
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: Users,
  ) {
    return this.sharedspacesService.createSharedspaceChat(targetSpace, dto, files, user);
  }

  @UseGuards(IsAuthenicatedGuard)
  @Patch(':url/chats')
  updateSharedspaceChat(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: UpdateSharedspaceChatDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspaceChat(targetSpace, dto, user);
  }

  @UseGuards(IsAuthenicatedGuard)
  @HttpCode(204)
  @Delete(':url/chats/:id')
  deleteSharedspaceChat(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Param('id', ParseIntPipe) chatId: number,
    @User() user: Users,
  ) {
    return this.sharedspacesService.deleteSharedspaceChat(targetSpace, chatId, user);
  }

  @UseGuards(IsAuthenicatedGuard)
  @HttpCode(204)
  @Delete(':url/chats/:ChatId/images/:ImageId')
  deleteSharedspaceChatImage(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Param('ChatId', ParseIntPipe) ChatId: number,
    @Param('ImageId', ParseIntPipe) ImageId: number,
    @User() user: Users,
  ) {
    return this.sharedspacesService.deleteSharedspaceChatImage(targetSpace, ChatId, ImageId, user);
  }
}