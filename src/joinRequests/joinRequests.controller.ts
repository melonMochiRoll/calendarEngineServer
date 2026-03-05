import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { JoinRequestsService } from "./joinRequests.service";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreateJoinRequestDTO } from "./dto/create.joinRequest.dto";
import { ResolveJoinRequestDTO } from "./dto/resolve.joinRequest.dto";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";

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
    @Param('url') url: string,
    @Body() dto: CreateJoinRequestDTO,
    @User() user: Users,
  ) {
    return this.joinRequestsService.createJoinRequest(url, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Delete(':url/joinrequest/:id')
  deleteJoinRequest(
    @Param('url') url: string,
    @Param('id', ParseIntPipe) joinRequestId: number,
    @User() user: Users,
  ) {
    return this.joinRequestsService.deleteJoinRequest(url, joinRequestId, user.id);
  }
}