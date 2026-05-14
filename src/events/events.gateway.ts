import { Ack, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatsService } from "src/chats/chats.service";
import { SendSharedspacechatDTO } from "./dto/send.sharedspace.chat.dto";
import { ChatAckStatus, ChatToClient, ChatToServer } from "src/common/constant/constants";
import { UseGuards } from "@nestjs/common";
import { SocketJwtAuthGuard } from "src/auth/authGuard/socket.jwt.auth.guard";
import { SocketCSRFAuthGuard } from "src/auth/authGuard/socket.csrf.auth.guard";
import { User } from "src/common/decorator/socket.user.decorator";
import { Users } from "src/entities/Users";
import { UpdateSharedspaceChatDTO } from "./dto/update.sharedspace.chat.dto";
import { DeleteSharedspaceChatDTO } from "./dto/delete.sharedspace.chat.dto";
import { DeleteSharedspaceChatImageDTO } from "./dto/delete.sharedspace.chat.image.dto";
import { Chats } from "src/entities/Chats";

@WebSocketGateway({
  cors: process.env.NODE_ENV === 'development' && {
    origin: process.env.FRONT_SERVER_ORIGIN,
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 1 * 60 * 1000,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private chatsService: ChatsService,
  ) {}

  @WebSocketServer()
  server: Server;

  handleConnection(@ConnectedSocket() socket: Socket) {}

  handleDisconnect(@ConnectedSocket() socket: Socket) {}

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.JOIN_SHAREDSPACE_ROOM)
  joinPublicChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() url: string,
  ) {
    socket.join(url);
  }

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.LEAVE_SHAREDSPACE_ROOM)
  leavePublicChat(
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
    @Ack() ack: (response: { status: string; data: Chats | null }) => void,
  ) {
    try {
      const chatWithUser = await this.chatsService.createSharedspaceChat(dto, user.id);

      socket
        .to(`/sharedspace-${dto.url}`)
        .emit(ChatToClient.CHAT_CREATED, chatWithUser.receiver);

      ack({ status: ChatAckStatus.SUCCESS, data: chatWithUser.sender });
    } catch (err) {
      ack({ status: ChatAckStatus.ERROR, data: null });
    }
  }

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.UPDATE_CHAT)
  async updateSharedspaceChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: UpdateSharedspaceChatDTO,
    @User() user: Users,
    @Ack() ack: (response: { status: string; data: Pick<Chats, 'id' | 'content' | 'updatedAt'> | null }) => void,
  ) {
    try {
      const updatedProperty = await this.chatsService.updateSharedspaceChat(dto, user.id);

      socket
        .to(`/sharedspace-${dto.url}`)
        .emit(ChatToClient.CHAT_UPDATED, updatedProperty);

      ack({ status: ChatAckStatus.SUCCESS, data: updatedProperty });
    } catch (err) {
      ack({ status: ChatAckStatus.ERROR, data: null });
    }
  }

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.DELETE_CHAT)
  async deleteSharedspaceChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DeleteSharedspaceChatDTO,
    @User() user: Users,
    @Ack() ack: (response: { status: string; data: Pick<Chats, 'id'> | null }) => void,
  ) {
    try {
      const deletedChatId = await this.chatsService.deleteSharedspaceChat(dto, user.id);

      socket
        .to(`/sharedspace-${dto.url}`)
        .emit(ChatToClient.CHAT_DELETED, { id: deletedChatId });

      ack({ status: ChatAckStatus.SUCCESS, data: { id: deletedChatId } });
    } catch (err) {
      ack({ status: ChatAckStatus.ERROR, data: null });
    }
  }

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage(ChatToServer.DELETE_CHAT_IMAGE)
  async deleteSharedspaceChatImage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DeleteSharedspaceChatImageDTO,
    @User() user: Users,
    @Ack() ack: (response: { status: string; data: Pick<Chats, 'id'> & { action: string } | { action: string, ChatId: string, ImageId: string } | null }) => void,
  ) {
    try {
      const { event, data } = await this.chatsService.deleteSharedspaceChatImage(dto, user.id);

      socket
        .to(`/sharedspace-${dto.url}`)
        .emit(event, data);

      ack({ status: ChatAckStatus.SUCCESS, data: { ...data, action: event } });
    } catch (err) {
      ack({ status: ChatAckStatus.ERROR, data: null });
    }
  }
}