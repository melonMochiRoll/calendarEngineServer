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
    @User() user: Users,
  ) {
    return this.invitesService.getInvites(beforeInviteId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  sendInvite(
    @Body() dto: SendInviteDTO,
    @User() user: Users,
  ) {
    return this.invitesService.sendInvite(dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('accept')
  acceptInvite(
    @Body() dto: AcceptInviteDTO,
    @User() user: Users,
  ) {
    return this.invitesService.acceptInvite(dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('decline')
  declineInvite(
    @Body() dto: DeclineInviteDTO,
    @User() user: Users,
  ) {
    return this.invitesService.declineInvite(dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cancel/:id')
  cancelInvite(
    @Param('id', UUIDv7ValidationPipe) targetInviteId: string,
    @Query('SharedspaceId') SharedspaceId: string,
    @User() user: Users,
  ) {
    return this.invitesService.cancelInvite(targetInviteId, SharedspaceId, user.id);
  }
}