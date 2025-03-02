import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: process.env.NODE_ENV === 'development' && {
    origin: process.env.DEV_FRONT_SERVER_ORIGIN,
    credentials: true,
  },
  namespace: /\/sharedspace-.+/,
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(@ConnectedSocket() socket: Socket) {
    socket.join(socket.nsp.name);
  }

  handleDisconnect() {
    // disconnection
  }
}