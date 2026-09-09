import { Body, Controller, Delete, Get, Post, Query, UseGuards } from "@nestjs/common";
import { FriendshipsService } from "./friendships.service";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { UserId } from "src/common/decorator/userId.decorator";
import { SendFriendshipDTO } from "./dto/send.friendship.dto";
import { Users } from "src/entities/Users";
import { RejectFriendshipDTO } from "./dto/reject.friendship.dto";
import { AcceptFriendshipDTO } from "./dto/accept.friendship.dto";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";
import { UUIDv7ValidationPipe } from "src/common/pipe/uuidv7.validation.pipe";

@Controller('api/friendships')
export class FriendshipsController {
  constructor(
    private friendshipsService: FriendshipsService,
  ) {}

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Get()
  getFriendships(
    @Query('before', UUIDv7OrEmptyPipe) beforeFriendshipId: string,
    @UserId() UserId: string,
  ) {
    return this.friendshipsService.getFriendships(beforeFriendshipId, UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Get('requests')
  getFriendshipRequests(
    @Query('before', UUIDv7OrEmptyPipe) beforeFriendshipRequestId: string,
    @UserId() UserId: string,
  ) {
    return this.friendshipsService.getFriendshipRequests(beforeFriendshipRequestId, UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post()
  sendFriendship(
    @Body() dto: SendFriendshipDTO,
    @UserId() UserId: string,
  ) {
    return this.friendshipsService.sendFriendship(dto, UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('accept')
  acceptFriendship(
    @Body() dto: AcceptFriendshipDTO,
    @UserId() UserId: string,
  ) {
    return this.friendshipsService.acceptFriendship(dto, UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('reject')
  rejectFriendship(
    @Body() dto: RejectFriendshipDTO,
    @UserId() UserId: string,
  ) {
    return this.friendshipsService.rejectFriendship(dto, UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Delete()
  deleteFriendship(
    @Query('target', UUIDv7ValidationPipe) RequesterId: string,
    @UserId() UserId: string,
  ) {
    return this.friendshipsService.deleteFriendship(RequesterId, UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Get('search')
  searchUser(
    @Query('query') query: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeUserId: string,
    @UserId() UserId: string,
  ) {
    return this.friendshipsService.searchUser(query, beforeUserId, UserId);
  }
}