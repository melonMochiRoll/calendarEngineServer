import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { JwtAuthGuard, PublicAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { GeneratePresignedPutUrlDTO } from "./dto/generate.presigned.put.url.dto";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";

@Controller('api')
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
  ) {}

  @UseGuards(PublicAuthGuard)
  @Get('sharedspaces/chatrooms/:id/chats')
  getSharedspaceChatRoomChats(
    @Param('id') id: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeChatId: string,
    @User() user: Users,
  ) {
    return this.chatsService.getSharedspaceChatRoomChats(
      id,
      beforeChatId,
      user?.id,
    );
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Get('chatrooms/:id/chats')
  getDmChatRoomChats(
    @Param('id') id: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeChatId: string,
    @User() user: Users,
  ) {
    return this.chatsService.getDmChatRoomChats(id, beforeChatId, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('space/:id/chats/images/presigned-url')
  generatePresignedPutUrl(
    @Param('id') id: string,
    @Body() dto: GeneratePresignedPutUrlDTO,
  ) {
    return this.chatsService.generatePresignedPutUrl(id, dto);
  }
}