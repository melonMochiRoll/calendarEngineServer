import { Controller, Get, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { InvitesService } from "./invites.service";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { Users } from "src/entities/Users";
import { User } from "src/common/decorator/user.decorator";

@Controller('api/invites')
export class InvitesContoller {
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
}