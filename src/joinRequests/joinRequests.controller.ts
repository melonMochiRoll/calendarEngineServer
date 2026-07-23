import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JoinRequestsService } from "./joinRequests.service";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreateJoinRequestDTO } from "./dto/create.joinRequest.dto";
import { ResolveJoinRequestDTO } from "./dto/resolve.joinRequest.dto";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { UUIDv7ValidationPipe } from "src/common/pipe/uuidv7.validation.pipe";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";

@Controller('api/sharedspaces')
export class JoinRequestsController {
  constructor(
    private joinRequestsService: JoinRequestsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':SharedspaceId/joinrequest')
  getJoinRequests(
    @Param('SharedspaceId') SharedspaceId: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeJoinRequestId: string,
    @User() user: Users,
  ) {
    return this.joinRequestsService.getJoinRequests(SharedspaceId, beforeJoinRequestId, user.id);
  }
  
  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':SharedspaceId/joinrequest/:id/resolve')
  resolveJoinRequest(
    @Param('SharedspaceId') SharedspaceId: string,
    @Param('id', UUIDv7ValidationPipe) joinRequestId: string,
    @Body() dto: ResolveJoinRequestDTO,
    @User() user: Users,
  ) {
    return this.joinRequestsService.resolveJoinRequest(
      SharedspaceId,
      joinRequestId,
      dto,
      user.id
    );
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':SharedspaceId/joinrequest')
  createJoinRequest(
    @Param('SharedspaceId') SharedspaceId: string,
    @Body() dto: CreateJoinRequestDTO,
    @User() user: Users,
  ) {
    return this.joinRequestsService.createJoinRequest(SharedspaceId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':url/joinrequest/:id')
  rejectJoinRequest(
    @Param('SharedspaceId') SharedspaceId: string,
    @Param('id', UUIDv7ValidationPipe) joinRequestId: string,
    @User() user: Users,
  ) {
    return this.joinRequestsService.rejectJoinRequest(SharedspaceId, joinRequestId, user.id);
  }
}