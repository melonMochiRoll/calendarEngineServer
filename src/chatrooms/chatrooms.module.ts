import { Module } from "@nestjs/common";
import { ChatRoomsController } from "./chatrooms.controller";
import { ChatRoomsService } from "./chatrooms.service";
import { RolesModule } from "src/roles/roles.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoomParticipants } from "src/entities/RoomParticipants";
import { ChatRooms } from "src/entities/ChatRooms";
import { ChatRoomsFetcher } from "./chatrooms.fetcher";
import { SharedspaceChatRooms } from "src/entities/SharedspaceChatRooms";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRooms,
      SharedspaceChatRooms,
      RoomParticipants,
    ]),
    RolesModule,
  ],
  controllers: [ ChatRoomsController ],
  providers: [
    ChatRoomsService,
    ChatRoomsFetcher,
  ],
  exports: [
    ChatRoomsFetcher,
  ],
})

export class ChatRoomsModule {}