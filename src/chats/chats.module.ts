import { Module } from "@nestjs/common";
import { ChatsController } from "./chats.controller";
import { ChatsService } from "./chats.service";
import { SharedspacesModule } from "src/sharedspaces/sharedspaces.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Chats } from "src/entities/Chats";
import { RolesModule } from "src/roles/roles.module";
import { Images } from "src/entities/Images";
import { StorageModule } from "src/storage/storage.module";
import { RefreshTokens } from "src/entities/RefreshTokens";
import { ChatImages } from "src/entities/ChatImages";
import { EventsGateway } from "./events.gateway";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chats,
      Images,
      ChatImages,
      RefreshTokens,
    ]),
    StorageModule,
    SharedspacesModule,
    UsersModule,
    RolesModule,
  ],
  controllers: [ ChatsController ],
  providers: [
    ChatsService,
    EventsGateway,
  ],
  exports: [ ChatsService ],
})

export class ChatsModule {}