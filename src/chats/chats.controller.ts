import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { JwtAuthGuard, PublicAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { GeneratePresignedPutUrlDTO } from "./dto/generate.presigned.put.url.dto";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreatChatspaceDTO } from "./dto/create.chatspace.dto";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";

@Controller('api')
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
  ) {}

  @UseGuards(PublicAuthGuard)
  @Get('sharedspaces/:url/chats')
  getSharedspaceChats(
    @Param('url') url: string,
    @Query('before') beforeChatId: string,
    @User() user: Users,
  ) {
    return this.chatsService.getSharedspaceChats(
      url,
      beforeChatId || null,
      user?.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('chatspaces/:url/chats')
  getChatspaceChats(
    @Param('url') url: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeChatId: string,
    @User() user: Users,
  ) {
    return this.chatsService.getChatspaceChats(
      url,
      beforeChatId,
      user.id,
    );
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('space/:url/chats/images/presigned-url')
  generatePresignedPutUrl(
    @Param('url') url: string,
    @Body() dto: GeneratePresignedPutUrlDTO,
  ) {
    return this.chatsService.generatePresignedPutUrl(url, dto);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('chatspaces')
  createChatSpace(
    @User() user: Users,
    @Body() dto: CreatChatspaceDTO,
  ) {
    return this.chatsService.createChatSpace(user.id, dto);
  }
}