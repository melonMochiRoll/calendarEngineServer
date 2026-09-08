import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { InvitesService } from "./invites.service";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { Users } from "src/entities/Users";
import { User } from "src/common/decorator/user.decorator";
import { SendInviteDTO } from "./dto/send.invite.dto";
import { AcceptInviteDTO } from "./dto/accept.invite.dto";
import { DeclineInviteDTO } from "./dto/decline.invite.dto";
import { UUIDv7ValidationPipe } from "src/common/pipe/uuidv7.validation.pipe";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";

@Controller('api/invites')
export class InvitesController {
  constructor(
    private invitesService: InvitesService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getInvites(
    @Query('before', UUIDv7OrEmptyPipe) beforeInviteId: string,
    @User() UserId: string,
  ) {
    return this.invitesService.getInvites(beforeInviteId, UserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  sendInvite(
    @Body() dto: SendInviteDTO,
    @User() UserId: string,
  ) {
    return this.invitesService.sendInvite(dto, UserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('accept')
  acceptInvite(
    @Body() dto: AcceptInviteDTO,
    @User() UserId: string,
  ) {
    return this.invitesService.acceptInvite(dto, UserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('decline')
  declineInvite(
    @Body() dto: DeclineInviteDTO,
    @User() UserId: string,
  ) {
    return this.invitesService.declineInvite(dto, UserId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cancel/:id')
  cancelInvite(
    @Param('id', UUIDv7ValidationPipe) targetInviteId: string,
    @Query('SharedspaceId', UUIDv7ValidationPipe) SharedspaceId: string,
    @User() UserId: string,
  ) {
    return this.invitesService.cancelInvite(targetInviteId, SharedspaceId, UserId);
  }
}