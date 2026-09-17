import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatsService } from "src/chats/chats.service";
import { SendSharedspacechatDTO } from "./dto/send.sharedspace.chat.dto";
import { CHATROOM_TYPE, ChatToClient, ChatToServer } from "src/common/constant/constants";
import { UseFilters, UseGuards } from "@nestjs/common";
import { SocketJwtAuthGuard } from "src/auth/authGuard/socket.jwt.auth.guard";
import { SocketCSRFAuthGuard } from "src/auth/authGuard/socket.csrf.auth.guard";
import { UserId } from "src/common/decorator/socket.userId.decorator";
import { UpdateSharedspaceChatDTO } from "./dto/update.sharedspace.chat.dto";
import { DeleteSharedspaceChatDTO } from "./dto/delete.sharedspace.chat.dto";
import { DeleteSharedspaceChatImageDTO } from "./dto/delete.sharedspace.chat.image.dto";
import { WsExceptionFilter } from "src/common/exception/ws-exception.filter";
import { RedisClientService } from "src/redisClient/redisClient.service";

@WebSocketGateway({
  cors: process.env.NODE_ENV === 'development' && {
    origin: process.env.FRONT_SERVER_ORIGIN,
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 1 * 60 * 1000,
  },
})
export class ChatsGateway {
  constructor(
    private chatsService: ChatsService,
    private redisClientService: RedisClientService,
  ) {}

  @WebSocketServer()
  server: Server;

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.JOIN_ROOM)
  joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() id: string,
    @UserId() UserId: string,
  ) {
    socket.join(id);
    socket.emit(ChatToClient.READY, 'ok');
    this.redisClientService.recordLastSeen(UserId);
  }

  @SubscribeMessage(ChatToServer.LEAVE_ROOM)
  leaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() id: string,
  ) {
    socket.leave(id);
  }

  @UseFilters(WsExceptionFilter)
  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.SEND_CHAT)
  async sendSharedspaceChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: SendSharedspacechatDTO,
    @UserId() UserId: string,
  ) {
    let chatWithUser;

    if (dto.type === CHATROOM_TYPE.SPACE) {
      chatWithUser = await this.chatsService.createSharedspaceChat(dto, UserId);
    }

    if (dto.type === CHATROOM_TYPE.DM) {
      chatWithUser = await this.chatsService.createDmChat(dto, UserId);
    }

    socket
      .emit(ChatToClient.CHAT_CREATED, chatWithUser.sender);

    socket
      .to(dto.ChatRoomId)
      .emit(ChatToClient.CHAT_CREATED, chatWithUser.receiver);
  }

  @UseFilters(WsExceptionFilter)
  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.UPDATE_CHAT)
  async updateSharedspaceChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: UpdateSharedspaceChatDTO,
    @UserId() UserId: string,
  ) {
    const updatedProperty = await this.chatsService.updateSharedspaceChat(dto, UserId);

    this.server
      .to(dto.ChatRoomId)
      .emit(ChatToClient.CHAT_UPDATED, updatedProperty);
  }

  @UseFilters(WsExceptionFilter)
  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.DELETE_CHAT)
  async deleteSharedspaceChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DeleteSharedspaceChatDTO,
    @UserId() UserId: string,
  ) {
    const deletedChatId = await this.chatsService.deleteSharedspaceChat(dto, UserId);

    this.server
      .to(dto.ChatRoomId)
      .emit(ChatToClient.CHAT_DELETED, { id: deletedChatId });
  }

  @UseFilters(WsExceptionFilter)
  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.DELETE_CHAT_IMAGE)
  async deleteSharedspaceChatImage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DeleteSharedspaceChatImageDTO,
    @UserId() UserId: string,
  ) {
    const { event, data } = await this.chatsService.deleteSharedspaceChatImage(dto, UserId);

    this.server
      .to(dto.ChatRoomId)
      .emit(event, data);
  }
}