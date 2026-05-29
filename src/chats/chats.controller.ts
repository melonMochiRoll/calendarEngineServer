import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { GeneratePresignedPutUrlDTO } from "./dto/generate.presigned.put.url.dto";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreatChatspaceDTO } from "./dto/create.chatspace.dto";

@Controller('api')
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
  ) {}

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