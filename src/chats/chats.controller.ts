import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { JwtAuthGuard, PublicAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
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
      beforeChatId || null,
      user?.id
    );
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @HttpCode(204)
  @Delete(':url/chats/:ChatId/images/:ImageId')
  deleteSharedspaceChatImage(
    @Param('url') url: string,
    @Param('ChatId') ChatId: string,
    @Param('ImageId') ImageId: string,
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