import { Module } from "@nestjs/common";
import { ChatspacesController } from "./chatspaces.controller";
import { ChatspacesService } from "./chatspaces.service";

@Module({
  imports: [],
  controllers: [ ChatspacesController ],
  providers: [ ChatspacesService ],
})

export class ChatspacesModule {}