import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { SharedspacesService } from "./sharedspaces.service";
import { CreateSharedspaceDTO } from "./dto/create.sharedspace.dto";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { OwnerOnlyRoles } from "src/common/decorator/owner.only.decorator";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreateSharedspaceMembersDTO } from "./dto/create.sharedspace.members.dto";
import { UpdateSharedspaceMembersDTO } from "./dto/update.sharedspace.members.dto";
import { UpdateSharedspacePrivateDTO } from "./dto/update.sharedspace.private.dto";
import { TransformSpacePipe } from "src/common/pipe/transform.space.pipe";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { CreateSharedspaceChatDTO } from "./dto/create.sharedspace.chat.dto";
import { FilesInterceptor } from "@nestjs/platform-express";
import { UpdateSharedspaceChatDTO } from "./dto/update.sharedspace.chat.dto";
import { JwtAuthGuard, PublicAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { RolesGuard } from "src/common/guard/roles.guard";

@Controller('api/sharedspaces')
export class SharedspacesController {
  constructor(
    private sharedspacesService: SharedspacesService,
  ) {}

  @UseGuards(PublicAuthGuard)
  @Get(':url/view')
  getSharedspace(
    @Param('url') url: string,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getSharedspace(url, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscribed')
  getSubscribedspaces(
    @Query('sort') sort: string,
    @Query('page', ParseIntPipe) page: number,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getSubscribedspaces(sort, user.id, page);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post()
  createSharedspace(@Body() dto: CreateSharedspaceDTO) {
    return this.sharedspacesService.createSharedspace(dto);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':url/name')
  updateSharedspaceName(
    @Param('url') url: string,
    @Body() dto: UpdateSharedspaceNameDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspaceName(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':url/owner')
  updateSharedspaceOwner(
    @Param('url') url: string,
    @Body() dto: UpdateSharedspaceOwnerDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspaceOwner(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':url/private')
  updateSharedspacePrivate(
    @Param('url') url: string,
    @Body() dto: UpdateSharedspacePrivateDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspacePrivate(url, dto, user.id);
  }
  
  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @HttpCode(204)
  @Delete(':url')
  deleteSharedspace(
    @Param('url') url: string,
    @User() user: Users,
  ) {
    return this.sharedspacesService.deleteSharedspace(url, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':url/members')
  createSharedspaceMembers(
    @Param('url') url: string,
    @Body() dto: CreateSharedspaceMembersDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.createSharedspaceMembers(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard, RolesGuard)
  @OwnerOnlyRoles()
  @Patch(':url/members')
  updateSharedspaceMembers(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: UpdateSharedspaceMembersDTO,
  ) {
    return this.sharedspacesService.updateSharedspaceMembers(targetSpace, dto);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard, RolesGuard)
  @OwnerOnlyRoles()
  @Delete(':url/members/:id')
  deleteSharedspaceMembers(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Param('id', ParseIntPipe) UserId: number,
  ) {
    return this.sharedspacesService.deleteSharedspaceMembers(targetSpace, UserId);
  }

  @UseGuards(PublicAuthGuard)
  @Get(':url/chats')
  getSharedspaceChats(
    @Param('url') url: string,
    @Query('page', ParseIntPipe) page: number,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getSharedspaceChats(url, page, user?.id);
  }

  @UseInterceptors(FilesInterceptor('images', 6, {
    limits: {
      fileSize: Number(process.env.MAX_CHAT_IMAGE_SIZE) * 1024 * 1024,
    },
  }))
  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':url/chats')
  createSharedspaceChat(
    @Param('url') url: string,
    @Body() dto: CreateSharedspaceChatDTO,
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: Users,
  ) {
    return this.sharedspacesService.createSharedspaceChat(url, dto, files, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':url/chats')
  updateSharedspaceChat(
    @Param('url') url: string,
    @Body() dto: UpdateSharedspaceChatDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspaceChat(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @HttpCode(204)
  @Delete(':url/chats/:id')
  deleteSharedspaceChat(
    @Param('url') url: string,
    @Param('id', ParseIntPipe) chatId: number,
    @User() user: Users,
  ) {
    return this.sharedspacesService.deleteSharedspaceChat(url, chatId, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @HttpCode(204)
  @Delete(':url/chats/:ChatId/images/:ImageId')
  deleteSharedspaceChatImage(
    @Param('url') url: string,
    @Param('ChatId', ParseIntPipe) ChatId: number,
    @Param('ImageId', ParseIntPipe) ImageId: number,
    @User() user: Users,
  ) {
    return this.sharedspacesService.deleteSharedspaceChatImage(url, ChatId, ImageId, user.id);
  }
}