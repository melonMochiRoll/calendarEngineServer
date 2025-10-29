import { Injectable, OnModuleInit } from "@nestjs/common";
import { RolesService } from "./roles/roles.service";

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private rolesService: RolesService,
  ) {}

  async onModuleInit() {
    await this.rolesService.getRolesArray();
  }
}