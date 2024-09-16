import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { SharedspacesService } from "./sharedspaces.service";
import { CreateSharedspaceDTO } from "./dto/create.sharedspace.dto";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { DeleteSharedspaceDTO } from "./dto/delete.sharedspace.dto";
import { OwnerOnlyRoles } from "src/common/decorator/owner.only.decorator";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { AuthRoleGuards } from "src/common/decorator/auth.role.decorator";
import { IsAuthenicatedGuard } from "src/auth/local.auth.guard";
import { DateValidationPipe } from "src/common/pipe/date.validation.pipe";

@Controller('api/sharedspaces')
export class SharedspacesController {
  constructor(
    private sharedspacesService: SharedspacesService,
  ) {}

  @UseGuards(IsAuthenicatedGuard)
  @Get()
  getSharedspaces(@User() user: Users) {
    return this.sharedspacesService.getSharedspaces(user);
  }

  @Get(':url/todos')
  getTodosForSpace(
    @Param('url') url: string,
    @Query('date', DateValidationPipe) date: string,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getTodosForSpace(
      url,
      date,
      user,
    );
  };

  @UseGuards(IsAuthenicatedGuard)
  @Post()
  createSharedspace(@Body() dto: CreateSharedspaceDTO) {
    return this.sharedspacesService.createSharedspace(dto);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Patch('name')
  updateSharedspaceName(@Body() dto: UpdateSharedspaceNameDTO) {
    return this.sharedspacesService.updateSharedspaceName(dto);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Patch('owner')
  updateSharedspaceOwner(@Body() dto: UpdateSharedspaceOwnerDTO) {
    return this.sharedspacesService.updateSharedspaceOwner(dto);
  }
  
  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Delete()
  deleteSharedspace(@Body() dto: DeleteSharedspaceDTO) {
    return this.sharedspacesService.deleteSharedspace(dto);
  }
}