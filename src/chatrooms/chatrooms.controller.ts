import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ChatRoomsService } from "./chatrooms.service";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { CreateChatRoomForDmDTO } from "./dto/create.chatroom.fordm.dto";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";

@Controller('api/chatrooms')
export class ChatRoomsController {
  constructor(
    private chatRoomsService: ChatRoomsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':url/members')
  getChatspaceParticipants(
    @Param('url') url: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeParticipantId: string,
    @User() user: Users,
  ) {
    return this.chatRoomsService.getChatRoomParticipants(url, user.id, beforeParticipantId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post()
  createChatSpaceForDM(
    @User() user: Users,
    @Body() dto: CreateChatRoomForDmDTO,
  ) {
    return this.chatRoomsService.createChatRoomForDM(user.id, dto);
  }
}