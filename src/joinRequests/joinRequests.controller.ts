import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JoinRequestsService } from "./joinRequests.service";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreateJoinRequestDTO } from "./dto/create.joinRequest.dto";
import { TransformSpacePipe } from "src/common/pipe/transform.space.pipe";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { TransformJoinRequestsPipe } from "src/common/pipe/transform.joinrequest.pipe";
import { JoinRequests } from "src/entities/JoinRequests";
import { OwnerOnlyRoles } from "src/common/decorator/owner.only.decorator";
import { AuthRoleGuards } from "src/common/decorator/auth.role.decorator";
import { ResolveJoinRequestDTO } from "./dto/resolve.joinRequest.dto";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";

@Controller('api/sharedspaces')
export class JoinRequestsController {
  constructor(
    private joinRequestsService: JoinRequestsService,
  ) {}

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Get(':url/joinrequest')
  getJoinRequests(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
  ) {
    return this.joinRequestsService.getJoinRequests(targetSpace);
  }
  
  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Post(':url/joinrequest/:id/resolve')
  resolveJoinRequest(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Param('id', TransformJoinRequestsPipe) targetJoinRequest: JoinRequests,
    @Body() dto: ResolveJoinRequestDTO,
  ) {
    return this.joinRequestsService.resolveJoinRequest(targetSpace, targetJoinRequest, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':url/joinrequest')
  createJoinRequest(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: CreateJoinRequestDTO,
    @User() user: Users,
  ) {
    return this.joinRequestsService.createJoinRequest(targetSpace, dto, user);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Delete(':url/joinrequest/:id')
  deleteJoinRequest(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Param('id', TransformJoinRequestsPipe) targetJoinRequest: JoinRequests,
  ) {
    return this.joinRequestsService.deleteJoinRequest(targetSpace, targetJoinRequest);
  }
}