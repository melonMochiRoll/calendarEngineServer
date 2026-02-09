import { Body, Controller, Get, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { InvitesService } from "./invites.service";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { Users } from "src/entities/Users";
import { User } from "src/common/decorator/user.decorator";
import { SendInviteDTO } from "./dto/send.invite.dto";
import { AcceptInviteDTO } from "./dto/accept.invite.dto";
import { DeclineInviteDTO } from "./dto/decline.invite.dto";

@Controller('api/invites')
export class InvitesController {
  constructor(
    private invitesService: InvitesService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getInvites(
    @Query('page', ParseIntPipe) page: number,
    @User() user: Users,
  ) {
    return this.invitesService.getInvites(user.id);
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
}