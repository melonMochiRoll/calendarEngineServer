import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { IsAuthenicatedGuard } from "src/auth/local.auth.guard";
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

@Controller('api/sharedspaces')
export class JoinRequestsController {
  constructor(
    private joinRequestsService: JoinRequestsService,
  ) {}
  
  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Post(':url/joinrequest/:id/resolve')
  resolveJoinRequest(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Param('id', TransformJoinRequestsPipe) targetJoinRequest: JoinRequests,
  ) {
    return this.joinRequestsService.resolveJoinRequest(targetSpace, targetJoinRequest);
  }

  @AuthRoleGuards()
  @OwnerOnlyRoles()
  @Post(':url/joinrequest/:id/reject')
  rejectJoinRequest(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Param('id', TransformJoinRequestsPipe) targetJoinRequest: JoinRequests,
  ) {
    return this.joinRequestsService.rejectJoinRequest(targetSpace, targetJoinRequest);
  }

  @UseGuards(IsAuthenicatedGuard)
  @Post(':url/joinrequest')
  createJoinRequest(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: CreateJoinRequestDTO,
    @User() user: Users,
  ) {
    return this.joinRequestsService.createJoinRequest(targetSpace, dto, user);
  }

  @UseGuards(IsAuthenicatedGuard)
  @Delete(':url/joinrequest/:id')
  deleteJoinRequest(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Param('id', TransformJoinRequestsPipe) targetJoinRequest: JoinRequests,
    @User() user: Users,
  ) {
    return this.joinRequestsService.deleteJoinRequest(targetSpace, targetJoinRequest, user);
  }
}