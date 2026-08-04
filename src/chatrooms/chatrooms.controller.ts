import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ChatRoomsService } from "./chatrooms.service";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { CreateDmChatRoomDTO } from "./dto/create.dm.chatroom.dto";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";
import { CreateSharedspaceChatRoomDTO } from "./dto/create.sharedspace.chatroom.dto";
import { UpdateSharedspaceChatRoomNameDTO } from "./dto/update.sharedspace.chatroom.name.dto";
import { CreateDmChatRoomParticipantsDTO } from "./dto/create.dm.chatroom.participants";

@Controller('api')
export class ChatRoomsController {
  constructor(
    private chatRoomsService: ChatRoomsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('chatrooms/:ChatRoomId/members')
  getChatRoomParticipants(
    @Param('ChatRoomId') ChatRoomId: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeParticipantId: string,
    @User() user: Users,
  ) {
    return this.chatRoomsService.getChatRoomParticipants(ChatRoomId, user.id, beforeParticipantId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('sharedspaces/:SharedspaceId/chatrooms')
  createSharedspaceChatRoom(
    @Param('SharedspaceId') SharedspaceId: string,
    @Body() dto: CreateSharedspaceChatRoomDTO,
    @User() user: Users,
  ) {
    return this.chatRoomsService.createSharedspaceChatRoom(SharedspaceId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('chatrooms')
  createDmChatRoom(
    @User() user: Users,
    @Body() dto: CreateDmChatRoomDTO,
  ) {
    return this.chatRoomsService.createDmChatRoom(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch('sharedspaces/:SharedspaceId/chatrooms/:ChatRoomId/name')
  updateSharedspaceChatRoomName(
    @Param('SharedspaceId') SharedspaceId: string,
    @Param('ChatRoomId') ChatRoomId: string,
    @Body() dto: UpdateSharedspaceChatRoomNameDTO,
    @User() user: Users,
  ) {
    return this.chatRoomsService.updateSharedspaceChatRoomName(SharedspaceId, ChatRoomId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Delete('sharedspaces/:SharedspaceId/chatrooms')
  deleteSharedspaceChatRoom(
    @Param('SharedspaceId') SharedspaceId: string,
    @Query('ChatRoomId') ChatRoomId: string,
    @User() user: Users,
  ) {
    return this.chatRoomsService.deleteSharedspaceChatRoom(SharedspaceId, ChatRoomId, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('dm/chatrooms/:ChatRoomId/participants')
  createDmChatRoomParticipants(
    @Param('ChatRoomId') ChatRoomId: string,
    @Body() dto: CreateDmChatRoomParticipantsDTO,
    @User() user: Users,
  ) {
    return this.chatRoomsService.createDmChatRoomParticipants(ChatRoomId, dto, user.id);
  }
}