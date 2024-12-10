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
    console.log(socket.nsp.name);
    socket.join(socket.nsp.name);
  }

  handleDisconnect() {
    console.log(`disconnection`);
  }
}