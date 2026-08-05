import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { JwtAuthGuard, PublicAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { GeneratePresignedPutUrlDTO } from "./dto/generate.presigned.put.url.dto";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";
import { UUIDv7ValidationPipe } from "src/common/pipe/uuidv7.validation.pipe";

@Controller('api')
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
  ) {}

  @UseGuards(PublicAuthGuard)
  @Get('sharedspaces/chatrooms/:ChatRoomId/chats')
  getSharedspaceChatRoomChats(
    @Param('ChatRoomId', UUIDv7ValidationPipe) ChatRoomId: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeChatId: string,
    @User() user: Users,
  ) {
    return this.chatsService.getSharedspaceChatRoomChats(
      ChatRoomId,
      beforeChatId,
      user?.id,
    );
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Get('dm/chatrooms/:ChatRoomId/chats')
  getDmChatRoomChats(
    @Param('ChatRoomId', UUIDv7ValidationPipe) ChatRoomId: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeChatId: string,
    @User() user: Users,
  ) {
    return this.chatsService.getDmChatRoomChats(ChatRoomId, beforeChatId, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('chatrooms/:ChatRoomId/presigned-url')
  generatePresignedPutUrl(
    @Param('ChatRoomId', UUIDv7ValidationPipe) ChatRoomId: string,
    @Body() dto: GeneratePresignedPutUrlDTO,
  ) {
    return this.chatsService.generatePresignedPutUrl(ChatRoomId, dto);
  }
}