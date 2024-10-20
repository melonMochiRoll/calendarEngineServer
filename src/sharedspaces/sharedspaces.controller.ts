import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { SharedspacesService } from "./sharedspaces.service";
import { CreateSharedspaceDTO } from "./dto/create.sharedspace.dto";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { OwnerOnlyRoles } from "src/common/decorator/owner.only.decorator";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { AuthRoleGuards } from "src/common/decorator/auth.role.decorator";
import { IsAuthenicatedGuard } from "src/auth/local.auth.guard";
import { TSubscribedspacesFilter } from "src/typings/types";
import { SubscribedFilterValidationPipe } from "src/common/pipe/subscribedFilter.validation.pipe";
import { PublicSpaceGuard } from "src/common/guard/public.space.guard";

@Controller('api/sharedspaces')
export class SharedspacesController {
  constructor(
    private sharedspacesService: SharedspacesService,
  ) {}

  @UseGuards(PublicSpaceGuard)
  @Get(':url/view')
  getSharedspace(
    @Param('url') url: string,
  ) {
    return this.sharedspacesService.getSharedspace(url);
  }

  @UseGuards(IsAuthenicatedGuard)
  @Get('subscribed')
  getSubscribedspaces(
    @Query('filter', SubscribedFilterValidationPipe) filter: TSubscribedspacesFilter,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getSubscribedspaces(filter, user);
  }

  @UseGuards(IsAuthenicatedGuard)
  @Post()
  createSharedspace(@Body() dto: CreateSharedspaceDTO) {
    return this.sharedspacesService.createSharedspace(dto);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Patch(':url/name')
  updateSharedspaceName(
    @Body() dto: UpdateSharedspaceNameDTO,
    @Param('url') url: string,
  ) {
    return this.sharedspacesService.updateSharedspaceName(dto, url);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Patch(':url/owner')
  updateSharedspaceOwner(
    @Body() dto: UpdateSharedspaceOwnerDTO,
    @Param('url') url: string,
  ) {
    return this.sharedspacesService.updateSharedspaceOwner(dto, url);
  }
  
  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @HttpCode(204)
  @Delete(':url')
  deleteSharedspace(@Param('url') url: string) {
    return this.sharedspacesService.deleteSharedspace(url);
  }
}