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
import { CreateSharedspaceMembersDTO } from "./dto/create.sharedspace.members.dto";

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
    @Param('url') url: string,
    @Body() dto: UpdateSharedspaceNameDTO,
  ) {
    return this.sharedspacesService.updateSharedspaceName(url, dto);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Patch(':url/owner')
  updateSharedspaceOwner(
    @Param('url') url: string,
    @Body() dto: UpdateSharedspaceOwnerDTO,
  ) {
    return this.sharedspacesService.updateSharedspaceOwner(url, dto);
  }
  
  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @HttpCode(204)
  @Delete(':url')
  deleteSharedspace(@Param('url') url: string) {
    return this.sharedspacesService.deleteSharedspace(url);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Post(':url/members')
  createSharedspaceMembers(
    @Param('url') url: string,
    @Body() dto: CreateSharedspaceMembersDTO,
  ) {
    return this.sharedspacesService.createSharedspaceMembers(url, dto);
  }
}