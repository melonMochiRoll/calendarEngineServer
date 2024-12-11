import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_ORIGIN,
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