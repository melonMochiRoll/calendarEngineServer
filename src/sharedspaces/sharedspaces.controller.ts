import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { SharedspacesService } from "./sharedspaces.service";
import { UpdateSharedspaceNameDTO } from "./dto/update.sharedspace.name.dto";
import { UpdateSharedspaceOwnerDTO } from "./dto/update.sharedspace.owner.dto";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreateSharedspaceMembersDTO } from "./dto/create.sharedspace.members.dto";
import { UpdateSharedspaceMembersDTO } from "./dto/update.sharedspace.members.dto";
import { UpdateSharedspacePrivateDTO } from "./dto/update.sharedspace.private.dto";
import { JwtAuthGuard, PublicAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { UUIDv7ValidationPipe } from "src/common/pipe/uuidv7.validation.pipe";
import { TSubscribedspacesSort } from "src/typings/types";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";

@Controller('api/sharedspaces')
export class SharedspacesController {
  constructor(
    private sharedspacesService: SharedspacesService,
  ) {}

  @UseGuards(PublicAuthGuard)
  @Get(':SharedspaceId/view')
  getSharedspace(
    @Param('SharedspaceId') SharedspaceId: string,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getSharedspace(SharedspaceId, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscribed')
  getSubscribedspaces(
    @Query('sort') sort: TSubscribedspacesSort,
    @Query('page', ParseIntPipe) page: number,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getSubscribedspaces(sort, user.id, page);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post()
  createSharedspace(@User() user: Users) {
    return this.sharedspacesService.createSharedspace(user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':SharedspaceId/name')
  updateSharedspaceName(
    @Param('SharedspaceId') SharedspaceId: string,
    @Body() dto: UpdateSharedspaceNameDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspaceName(SharedspaceId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':SharedspaceId/owner')
  updateSharedspaceOwner(
    @Param('SharedspaceId') SharedspaceId: string,
    @Body() dto: UpdateSharedspaceOwnerDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspaceOwner(SharedspaceId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':SharedspaceId/private')
  updateSharedspacePrivate(
    @Param('SharedspaceId') SharedspaceId: string,
    @Body() dto: UpdateSharedspacePrivateDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspacePrivate(SharedspaceId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Delete(':SharedspaceId')
  scheduleSharedspaceDeletion(
    @Param('SharedspaceId') SharedspaceId: string,
    @User() user: Users,
  ) {
    return this.sharedspacesService.scheduleSharedspaceDeletion(SharedspaceId, user.id);
  }

  @UseGuards(PublicAuthGuard)
  @Get(':SharedspaceId/members')
  getSharedspaceMembers(
    @Param('SharedspaceId') SharedspaceId: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeUserId: string,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getSharedspaceMembers(SharedspaceId, beforeUserId, user?.id)
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':SharedspaceId/members')
  createSharedspaceMembers(
    @Param('SharedspaceId') SharedspaceId: string,
    @Body() dto: CreateSharedspaceMembersDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.createSharedspaceMembers(SharedspaceId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Patch(':SharedspaceId/members')
  updateSharedspaceMembers(
    @Param('SharedspaceId') SharedspaceId: string,
    @Body() dto: UpdateSharedspaceMembersDTO,
    @User() user: Users,
  ) {
    return this.sharedspacesService.updateSharedspaceMembers(SharedspaceId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Delete(':SharedspaceId/members/:id')
  deleteSharedspaceMembers(
    @Param('SharedspaceId') SharedspaceId: string,
    @Param('id', UUIDv7ValidationPipe) targetUserId: string,
    @User() user: Users,
  ) {
    return this.sharedspacesService.deleteSharedspaceMembers(SharedspaceId, targetUserId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':SharedspaceId/users/search')
  searchUsers(
    @Param('SharedspaceId') SharedspaceId: string,
    @Query('query') query: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeUserId: string,
  ) {
    return this.sharedspacesService.searchUsers(SharedspaceId, query, beforeUserId);
  }
}