import { Module } from "@nestjs/common";
import { EventsGateway } from "./events.gateway";
import { ChatsModule } from "src/chats/chats.module";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [
    ChatsModule,
    UsersModule,
  ],
  providers: [ EventsGateway ],
  exports: [ EventsGateway ],
})

export class EventsModule {}