import { Module } from "@nestjs/common";
import { ChatRoomsController } from "./chatrooms.controller";
import { ChatRoomsService } from "./chatrooms.service";
import { RolesModule } from "src/roles/roles.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoomParticipants } from "src/entities/RoomParticipants";
import { ChatRooms } from "src/entities/ChatRooms";
import { ChatRoomsFetcher } from "./chatrooms.fetcher";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRooms,
      RoomParticipants,
    ]),
    RolesModule,
  ],
  controllers: [ ChatRoomsController ],
  providers: [
    ChatRoomsService,
    ChatRoomsFetcher,
  ],
})

export class ChatRoomsModule {}