import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatsService } from "src/chats/chats.service";
import { SendSharedspacechatDTO } from "./dto/send.sharedspace.chat.dto";
import { CHAT_EVENT } from "src/common/constant/constants";
import { UseGuards } from "@nestjs/common";
import { SocketJwtAuthGuard } from "src/auth/authGuard/socket.jwt.auth.guard";
import { SocketCSRFAuthGuard } from "src/auth/authGuard/socket.csrf.auth.guard";
import { User } from "src/common/decorator/socket.user.decorator";
import { Users } from "src/entities/Users";
import { UpdateSharedspaceChatDTO } from "./dto/update.sharedspace.chat.dto";
import { permission } from "process";

@WebSocketGateway({
  cors: process.env.NODE_ENV === 'development' && {
    origin: process.env.FRONT_SERVER_ORIGIN,
    credentials: true,
  },
  namespace: /\/sharedspace-.+/,
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

  handleConnection(@ConnectedSocket() socket: Socket) {
    socket.join(socket.nsp.name);
  }

  handleDisconnect() {
    // disconnection
  }

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage('send_sharedspace_chat')
  async sendSharedspaceChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: SendSharedspacechatDTO,
    @User() user: Users,
  ) {
    try {
      const chatWithUser = await this.chatsService.createSharedspaceChat(dto, user.id);

      socket
        .to(`/sharedspace-${dto.url}`)
        .emit(`publicChats:${CHAT_EVENT.CHAT_CREATED}`, chatWithUser.receiver);

      socket
        .emit(`publicChats:${CHAT_EVENT.CHAT_CREATED}`, chatWithUser.sender);
    } catch (err) {
      socket
        .emit(`publicChats:${CHAT_EVENT.CHAT_ERROR}`, {
          action: `publicChats:${CHAT_EVENT.CHAT_CREATED}`,
          ChatId: dto.id,
        });
    }
  }

  @UseGuards(SocketJwtAuthGuard, SocketCSRFAuthGuard)
  @SubscribeMessage('update_sharedspace_chat')
  async updateSharedspaceChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: UpdateSharedspaceChatDTO,
    @User() user: Users,
  ) {
    try {
      const updatedProperty = await this.chatsService.updateSharedspaceChat(dto, user.id);

      this.server
        .to(`/sharedspace-${dto.url}`)
        .emit(`publicChats:${CHAT_EVENT.CHAT_UPDATED}`, updatedProperty);
    } catch (err) {
      socket
        .emit(`publicChats:${CHAT_EVENT.CHAT_ERROR}`, {
          action: `publicChats:${CHAT_EVENT.CHAT_UPDATED}`,
          ChatId: dto.id,
        });
    }
  }
}