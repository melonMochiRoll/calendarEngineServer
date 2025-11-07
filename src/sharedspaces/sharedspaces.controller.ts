import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { SharedspacesService } from "./sharedspaces.service";
import { CreateSharedspaceDTO } from "./dto/create.sharedspace.dto";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreateSharedspaceMembersDTO } from "./dto/create.sharedspace.members.dto";
import { UpdateSharedspaceMembersDTO } from "./dto/update.sharedspace.members.dto";
import { UpdateSharedspacePrivateDTO } from "./dto/update.sharedspace.private.dto";
import { JwtAuthGuard, PublicAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";

@Controller('api/sharedspaces')
export class SharedspacesController {
  constructor(
    private sharedspacesService: SharedspacesService,
  ) {}

  @UseGuards(PublicAuthGuard)
  @Get(':url/view')
  getSharedspace(
    @Param('url') url: string,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getSharedspace(url, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscribed')
  getSubscribedspaces(
    @Query('sort') sort: string,
    @Query('page', ParseIntPipe) page: number,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getSubscribedspaces(sort, user.id, page);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post()
  createSharedspace(@Body() dto: CreateSharedspaceDTO) {
    return this.sharedspacesService.createSharedspace(dto);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':url/name')
  updateSharedspaceName(
    @Param('url') url: string,
    @Body() dto: UpdateSharedspaceNameDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspaceName(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':url/owner')
  updateSharedspaceOwner(
    @Param('url') url: string,
    @Body() dto: UpdateSharedspaceOwnerDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspaceOwner(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':url/private')
  updateSharedspacePrivate(
    @Param('url') url: string,
    @Body() dto: UpdateSharedspacePrivateDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspacePrivate(url, dto, user.id);
  }
  
  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @HttpCode(204)
  @Delete(':url')
  deleteSharedspace(
    @Param('url') url: string,
    @User() user: Users,
  ) {
    return this.sharedspacesService.deleteSharedspace(url, user.id);
  }

  @UseGuards(PublicAuthGuard)
  @Get(':url/members')
  getSharedspaceMembers(
    @Param('url') url: string,
    @Query('page', ParseIntPipe) page: number,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getSharedspaceMembers(url, page, user?.id)
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':url/members')
  createSharedspaceMembers(
    @Param('url') url: string,
    @Body() dto: CreateSharedspaceMembersDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.createSharedspaceMembers(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':url/members')
  updateSharedspaceMembers(
    @Param('url') url: string,
    @Body() dto: UpdateSharedspaceMembersDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspaceMembers(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Delete(':url/members/:id')
  deleteSharedspaceMembers(
    @Param('url') url: string,
    @Param('id', ParseIntPipe) targetUserId: number,
    @User() user: Users,
  ) {
    return this.sharedspacesService.deleteSharedspaceMembers(url, targetUserId, user.id);
  }
}