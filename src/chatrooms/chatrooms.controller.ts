import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ChatRoomsService } from "./chatrooms.service";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { CreateDmChatRoomDTO } from "./dto/create.dm.chatroom.dto";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";

@Controller('api/chatrooms')
export class ChatRoomsController {
  constructor(
    private chatRoomsService: ChatRoomsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id/members')
  getChatRoomParticipants(
    @Param('id') id: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeParticipantId: string,
    @User() user: Users,
  ) {
    return this.chatRoomsService.getChatRoomParticipants(id, user.id, beforeParticipantId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post()
  createDmChatRoom(
    @User() user: Users,
    @Body() dto: CreateDmChatRoomDTO,
  ) {
    return this.chatRoomsService.createDmChatRoom(user.id, dto);
  }
}