import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JoinRequestsService } from "./joinRequests.service";
import { UserId } from "src/common/decorator/userId.decorator";
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
    @Param('SharedspaceId', UUIDv7ValidationPipe) SharedspaceId: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeJoinRequestId: string,
    @UserId() UserId: string,
  ) {
    return this.joinRequestsService.getJoinRequests(SharedspaceId, beforeJoinRequestId, UserId);
  }
  
  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':SharedspaceId/joinrequest/:id/resolve')
  resolveJoinRequest(
    @Param('SharedspaceId', UUIDv7ValidationPipe) SharedspaceId: string,
    @Param('id', UUIDv7ValidationPipe) joinRequestId: string,
    @Body() dto: ResolveJoinRequestDTO,
    @UserId() UserId: string,
  ) {
    return this.joinRequestsService.resolveJoinRequest(
      SharedspaceId,
      joinRequestId,
      dto,
      UserId
    );
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':SharedspaceId/joinrequest')
  createJoinRequest(
    @Param('SharedspaceId', UUIDv7ValidationPipe) SharedspaceId: string,
    @Body() dto: CreateJoinRequestDTO,
    @UserId() UserId: string,
  ) {
    return this.joinRequestsService.createJoinRequest(SharedspaceId, dto, UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post(':url/joinrequest/:id')
  rejectJoinRequest(
    @Param('SharedspaceId', UUIDv7ValidationPipe) SharedspaceId: string,
    @Param('id', UUIDv7ValidationPipe) joinRequestId: string,
    @UserId() UserId: string,
  ) {
    return this.joinRequestsService.rejectJoinRequest(SharedspaceId, joinRequestId, UserId);
  }
}