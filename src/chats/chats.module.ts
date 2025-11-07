import { Module } from "@nestjs/common";
import { ChatsController } from "./chats.controller";
import { ChatsService } from "./chats.service";
import { SharedspacesModule } from "src/sharedspaces/sharedspaces.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Chats } from "src/entities/Chats";
import { RolesModule } from "src/roles/roles.module";
import { Images } from "src/entities/Images";
import { EventsModule } from "src/events/events.module";
import { AwsModule } from "src/aws/aws.module";
import { RefreshTokens } from "src/entities/RefreshTokens";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chats,
      Images,
      RefreshTokens,
    ]),
    EventsModule,
    AwsModule,
    SharedspacesModule,
    RolesModule,
  ],
  controllers: [ ChatsController ],
  providers: [ ChatsService ],
  exports: [],
})

export class ChatsModule {}