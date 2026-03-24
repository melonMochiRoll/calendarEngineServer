import { Injectable, OnModuleInit } from "@nestjs/common";
import { RolesService } from "./roles/roles.service";
import { UsersService } from "./users/users.service";

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private rolesService: RolesService,
    private usersService: UsersService,
  ) {}

  async onModuleInit() {
    await this.usersService.initGhostUser();
    await this.rolesService.initRoles();
    await this.rolesService.getRolesArray();
  }
}