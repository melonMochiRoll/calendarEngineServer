import { Controller } from "@nestjs/common";
import { RolesService } from "./roles.service";

@Controller('api/roles')
export class RolesController {
  constructor(
    private rolesService: RolesService,
  ) {}
}