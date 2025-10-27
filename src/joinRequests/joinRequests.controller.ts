import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { JoinRequestsService } from "./joinRequests.service";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreateJoinRequestDTO } from "./dto/create.joinRequest.dto";
import { TransformSpacePipe } from "src/common/pipe/transform.space.pipe";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { TransformJoinRequestsPipe } from "src/common/pipe/transform.joinrequest.pipe";
import { JoinRequests } from "src/entities/JoinRequests";
import { OwnerOnlyRoles } from "src/common/decorator/owner.only.decorator";
import { ResolveJoinRequestDTO } from "./dto/resolve.joinRequest.dto";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { RolesGuard } from "src/common/guard/roles.guard";

@Controller('api/sharedspaces')
export class JoinRequestsController {
  constructor(
    private joinRequestsService: JoinRequestsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':url/joinrequest')
  getJoinRequests(
    @Param('url') url: string,
    @User() user: Users,
  ) {
    return this.joinRequestsService.getJoinRequests(url, user.id);
  }
  
  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':url/joinrequest/:id/resolve')
  resolveJoinRequest(
    @Param('url') url: string,
    @Param('id', ParseIntPipe) joinRequestId: number,
    @Body() dto: ResolveJoinRequestDTO,
    @User() user: Users,
  ) {
    return this.joinRequestsService.resolveJoinRequest(
      url,
      joinRequestId,
      dto,
      user.id
    );
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':url/joinrequest')
  createJoinRequest(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Body() dto: CreateJoinRequestDTO,
    @User() user: Users,
  ) {
    return this.joinRequestsService.createJoinRequest(targetSpace, dto, user);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard, RolesGuard)
  @OwnerOnlyRoles()
  @Delete(':url/joinrequest/:id')
  deleteJoinRequest(
    @Param('url', TransformSpacePipe) targetSpace: Sharedspaces,
    @Param('id', TransformJoinRequestsPipe) targetJoinRequest: JoinRequests,
  ) {
    return this.joinRequestsService.deleteJoinRequest(targetSpace, targetJoinRequest);
  }
}