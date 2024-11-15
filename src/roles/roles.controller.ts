import { Body, Controller, Post } from "@nestjs/common";
import { RolesService } from "./roles.service";
import { CreateRoleDTO } from "./dto/create.role.dto";

@Controller('api/roles')
export class RolesController {
  constructor(
    private rolesService: RolesService,
  ) {}

  @Post()
  createRole(
    @Body() dto: CreateRoleDTO,
  ) {
    return this.rolesService.createRole(dto);
  }
}