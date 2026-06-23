import { Module } from "@nestjs/common";
import { ChatspacesController } from "./chatspaces.controller";
import { ChatspacesService } from "./chatspaces.service";
import { RolesModule } from "src/roles/roles.module";
import { SharedspacesModule } from "src/sharedspaces/sharedspaces.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SpaceMembers } from "src/entities/SpaceMembers";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SpaceMembers,
    ]),
    RolesModule,
    SharedspacesModule,
  ],
  controllers: [ ChatspacesController ],
  providers: [ ChatspacesService ],
})

export class ChatspacesModule {}