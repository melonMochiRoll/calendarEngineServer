import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
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
import { LengthValidationPipe } from "src/common/pipe/length.validation.pipe";

@Controller('api/sharedspaces')
export class SharedspacesController {
  constructor(
    private sharedspacesService: SharedspacesService,
  ) {}

  @UseGuards(IsAuthenicatedGuard)
  @Get()
  getSubscribedspaces(@User() user: Users) { // TODO: filter query 추가
    return this.sharedspacesService.getSubscribedspaces(user);
  }

  @Get(':url/todos')
  getTodosForSpace(
    @Param('url', new LengthValidationPipe(5)) url: string,
    @Query('date', DateValidationPipe) date: string,
    @User() user: Users,
  ) {
    return this.sharedspacesService.getTodosForSpace(
      url,
      date,
      user,
    );
  }

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

  @Get(':url/todos/search')
  searchTodos(
    @Param('url', new LengthValidationPipe(5)) url: string,
    @Query('query') query: string,
    @Query('offset', ParseIntPipe) offset: number,
    @Query('limit', ParseIntPipe) limit: number,
    @User() user: Users,
  ) {
    return this.sharedspacesService.searchTodos(
      url,
      query,
      offset,
      limit,
      user,
    );
  }
}