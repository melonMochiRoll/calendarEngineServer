import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { JwtAuthGuard, PublicAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { FilesInterceptor, NoFilesInterceptor } from "@nestjs/platform-express";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { CreateSharedspaceChatDTO } from "./dto/create.sharedspace.chat.dto";
import { UpdateSharedspaceChatDTO } from "./dto/update.sharedspace.chat.dto";
import { GeneratePresignedPutUrlDTO } from "./dto/generate.presigned.put.url.dto";

@Controller('api/sharedspaces')
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
  ) {}

  @UseGuards(PublicAuthGuard)
  @Get(':url/chats')
  getSharedspaceChats(
    @Param('url') url: string,
    @Query('before') beforeChatId: string,
    @User() user: Users,
  ) {
    return this.chatsService.getSharedspaceChats(
      url,
      beforeChatId ? Number(beforeChatId) : null,
      user?.id
    );
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':url/chats')
  createSharedspaceChat(
    @Param('url') url: string,
    @Body() dto: CreateSharedspaceChatDTO,
    @User() user: Users,
  ) {
    return this.chatsService.createSharedspaceChat(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':url/chats')
  updateSharedspaceChat(
    @Param('url') url: string,
    @Body() dto: UpdateSharedspaceChatDTO,
    @User() user: Users,
  ) {
    return this.chatsService.updateSharedspaceChat(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @HttpCode(204)
  @Delete(':url/chats/:id')
  deleteSharedspaceChat(
    @Param('url') url: string,
    @Param('id', ParseIntPipe) chatId: number,
    @User() user: Users,
  ) {
    return this.chatsService.deleteSharedspaceChat(url, chatId, user.id);
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
    return this.chatsService.deleteSharedspaceChatImage(url, ChatId, ImageId, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':url/chats/images/presigned-url')
  generatePresignedPutUrl(
    @Param('url') url: string,
    @Body() dto: GeneratePresignedPutUrlDTO,
  ) {
    return this.chatsService.generatePresignedPutUrl(url, dto);
  }
}