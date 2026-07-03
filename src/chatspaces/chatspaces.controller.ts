import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ChatspacesService } from "./chatspaces.service";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { CreatChatspaceDTO } from "./dto/create.chatspace.dto";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";

@Controller('api/chatspaces')
export class ChatspacesController {
  constructor(
    private chatspacesService: ChatspacesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':url/members')
  getChatspaceMembers(
    @Param('url') url: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeUserId: string,
    @User() user: Users,
  ) {
    return this.chatspacesService.getChatspaceMembers(url, beforeUserId, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post()
  createChatSpace(
    @User() user: Users,
    @Body() dto: CreatChatspaceDTO,
  ) {
    return this.chatspacesService.createChatSpace(user.id, dto);
  }
}