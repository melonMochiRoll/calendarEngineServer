import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { FriendshipsService } from "./friendships.service";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { SendFriendshipDTO } from "./dto/send.friendship.dto";
import { Users } from "src/entities/Users";
import { RejectFriendshipDTO } from "./dto/reject.friendship.dto";
import { AcceptFriendshipDTO } from "./dto/accept.friendship.dto";

@Controller('api/friendships')
export class FriendshipsController {
  constructor(
    private friendshipsService: FriendshipsService,
  ) {}

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post()
  sendFriendship(
    @Body() dto: SendFriendshipDTO,
    @User() user: Users,
  ) {
    return this.friendshipsService.sendFriendship(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('accept')
  acceptFriendship(
    @Body() dto: AcceptFriendshipDTO,
    @User() user: Users,
  ) {
    return this.friendshipsService.acceptFriendship(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('reject')
  rejectFriendship(
    @Body() dto: RejectFriendshipDTO,
    @User() user: Users,
  ) {
    return this.friendshipsService.rejectFriendship(dto, user.id);
  }
}