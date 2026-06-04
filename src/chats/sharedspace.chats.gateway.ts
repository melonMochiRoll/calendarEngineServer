import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatsService } from "src/chats/chats.service";
import { SendSharedspacechatDTO } from "./dto/send.sharedspace.chat.dto";
import { ChatToClient, ChatToServer } from "src/common/constant/constants";
import { UseGuards } from "@nestjs/common";
import { SocketJwtAuthGuard } from "src/auth/authGuard/socket.jwt.auth.guard";
import { SocketCSRFAuthGuard } from "src/auth/authGuard/socket.csrf.auth.guard";
import { User } from "src/common/decorator/socket.user.decorator";
import { Users } from "src/entities/Users";
import { UpdateSharedspaceChatDTO } from "./dto/update.sharedspace.chat.dto";
import { DeleteSharedspaceChatDTO } from "./dto/delete.sharedspace.chat.dto";
import { DeleteSharedspaceChatImageDTO } from "./dto/delete.sharedspace.chat.image.dto";

@WebSocketGateway({
  cors: process.env.NODE_ENV === 'development' && {
    origin: process.env.FRONT_SERVER_ORIGIN,
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 1 * 60 * 1000,
  },
})
export class SharedspaceChatsGateway {
  constructor(
    private chatsService: ChatsService,
  ) {}

  @WebSocketServer()
  server: Server;

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.JOIN_ROOM)
  joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() url: string,
  ) {
    socket.join(url);
  }

  @SubscribeMessage(ChatToServer.LEAVE_ROOM)
  leaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() url: string,
  ) {
    socket.leave(url);
  }

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.SEND_CHAT)
  async sendSharedspaceChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: SendSharedspacechatDTO,
    @User() user: Users,
  ) {
    try {
      const chatWithUser = await this.chatsService.createSharedspaceChat(dto, user.id);

      socket
        .emit(ChatToClient.CHAT_CREATED, chatWithUser.sender);

      socket
        .to(dto.url)
        .emit(ChatToClient.CHAT_CREATED, chatWithUser.receiver);
    } catch (err) {
      socket.emit(ChatToClient.CHAT_ERROR, { event: ChatToClient.CHAT_CREATED, ChatId: dto.id });
    }
  }

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.UPDATE_CHAT)
  async updateSharedspaceChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: UpdateSharedspaceChatDTO,
    @User() user: Users,
  ) {
    try {
      const updatedProperty = await this.chatsService.updateSharedspaceChat(dto, user.id);

      this.server
        .to(dto.url)
        .emit(ChatToClient.CHAT_UPDATED, updatedProperty);
    } catch (err) {
      socket.emit(ChatToClient.CHAT_ERROR, { event: ChatToClient.CHAT_UPDATED, ChatId: dto.id });
    }
  }

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.DELETE_CHAT)
  async deleteSharedspaceChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DeleteSharedspaceChatDTO,
    @User() user: Users,
  ) {
    try {
      const deletedChatId = await this.chatsService.deleteSharedspaceChat(dto, user.id);

      this.server
        .to(dto.url)
        .emit(ChatToClient.CHAT_DELETED, { id: deletedChatId });
    } catch (err) {
      socket.emit(ChatToClient.CHAT_ERROR, { event: ChatToClient.CHAT_DELETED, ChatId: dto.id });
    }
  }

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.DELETE_CHAT_IMAGE)
  async deleteSharedspaceChatImage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DeleteSharedspaceChatImageDTO,
    @User() user: Users,
  ) {
    try {
      const { event, data } = await this.chatsService.deleteSharedspaceChatImage(dto, user.id);

      this.server
        .to(dto.url)
        .emit(event, data);
    } catch (err) {
      socket.emit(ChatToClient.CHAT_ERROR, { event: ChatToClient.CHAT_IMAGE_DELETED, ChatId: dto.ChatId });
    }
  }
}