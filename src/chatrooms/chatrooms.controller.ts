import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ChatRoomsService } from "./chatrooms.service";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { CreateDmChatRoomDTO } from "./dto/create.dm.chatroom.dto";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";
import { CreateSharedspaceChatRoomDTO } from "./dto/create.sharedspace.chatroom.dto";
import { UpdateSharedspaceChatRoomNameDTO } from "./dto/update.sharedspace.chatroom.name.dto";
import { InviteDmChatRoomDTO } from "./dto/invite.dm.chatroom";
import { UUIDv7ValidationPipe } from "src/common/pipe/uuidv7.validation.pipe";

@Controller('api')
export class ChatRoomsController {
  constructor(
    private chatRoomsService: ChatRoomsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('chatrooms/:ChatRoomId/members')
  getChatRoomParticipants(
    @Param('ChatRoomId', UUIDv7ValidationPipe) ChatRoomId: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeParticipantId: string,
    @User() UserId: string,
  ) {
    return this.chatRoomsService.getChatRoomParticipants(ChatRoomId, UserId, beforeParticipantId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('sharedspaces/:SharedspaceId/chatrooms')
  createSharedspaceChatRoom(
    @Param('SharedspaceId', UUIDv7ValidationPipe) SharedspaceId: string,
    @Body() dto: CreateSharedspaceChatRoomDTO,
    @User() UserId: string,
  ) {
    return this.chatRoomsService.createSharedspaceChatRoom(SharedspaceId, dto, UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('dms/chatrooms')
  createDmChatRoom(
    @User() UserId: string,
    @Body() dto: CreateDmChatRoomDTO,
  ) {
    return this.chatRoomsService.createDmChatRoom(UserId, dto);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch('sharedspaces/:SharedspaceId/chatrooms/:ChatRoomId/name')
  updateSharedspaceChatRoomName(
    @Param('SharedspaceId', UUIDv7ValidationPipe) SharedspaceId: string,
    @Param('ChatRoomId', UUIDv7ValidationPipe) ChatRoomId: string,
    @Body() dto: UpdateSharedspaceChatRoomNameDTO,
    @User() UserId: string,
  ) {
    return this.chatRoomsService.updateSharedspaceChatRoomName(SharedspaceId, ChatRoomId, dto, UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Delete('sharedspaces/:SharedspaceId/chatrooms/:ChatRoomId')
  deleteSharedspaceChatRoom(
    @Param('SharedspaceId', UUIDv7ValidationPipe) SharedspaceId: string,
    @Param('ChatRoomId', UUIDv7ValidationPipe) ChatRoomId: string,
    @User() UserId: string,
  ) {
    return this.chatRoomsService.deleteSharedspaceChatRoom(SharedspaceId, ChatRoomId, UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('dms/chatrooms/:ChatRoomId/participants')
  inviteDmChatRoom(
    @Param('ChatRoomId', UUIDv7ValidationPipe) ChatRoomId: string,
    @Body() dto: InviteDmChatRoomDTO,
    @User() UserId: string,
  ) {
    return this.chatRoomsService.inviteDmChatRoom(ChatRoomId, dto, UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Delete('dms/chatrooms/:ChatRoomId/participants/me')
  leaveDmChatRoom(
    @Param('ChatRoomId', UUIDv7ValidationPipe) ChatRoomId: string,
    @User() UserId: string,
  ) {
    return this.chatRoomsService.leaveDmChatRoom(ChatRoomId, UserId);
  }
}