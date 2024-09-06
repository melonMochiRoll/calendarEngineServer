import { Body, Controller, Delete, Patch, Post, UseGuards } from "@nestjs/common";
import { SharedspacesService } from "./sharedspaces.service";
import { CreateSharedspaceDTO } from "./dto/create.sharedspace.dto";
import { IsAuthenicatedGuard } from "src/auth/local.auth.guard";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { DeleteSharedspaceDTO } from "./dto/delete.sharedspace.dto";
import { RolesGuard } from "src/common/guard/roles.guard";
import { OwnerOnlyRoles } from "src/common/decorator/owner.only.decorator";

@UseGuards(IsAuthenicatedGuard)
@UseGuards(RolesGuard)
@Controller('api/sharedspaces')
export class SharedspacesController {
  constructor(
    private sharedspacesService: SharedspacesService,
  ) {}

  @Post()
  createSharedspace(@Body() dto: CreateSharedspaceDTO) {
    return this.sharedspacesService.createSharedspace(dto);
  }

  @OwnerOnlyRoles()
  @Patch('name')
  updateSharedspaceName(@Body() dto: UpdateSharedspaceNameDTO) {
    return this.sharedspacesService.updateSharedspaceName(dto);
  }

  @OwnerOnlyRoles()
  @Patch('owner')
  updateSharedspaceOwner(@Body() dto: UpdateSharedspaceOwnerDTO) {
    return this.sharedspacesService.updateSharedspaceOwner(dto);
  }
  
  @OwnerOnlyRoles()
  @Delete()
  deleteSharedspace(@Body() dto: DeleteSharedspaceDTO) {
    return this.sharedspacesService.deleteSharedspace(dto);
  }
}