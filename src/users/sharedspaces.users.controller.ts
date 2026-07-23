import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { UsersService } from "./users.service";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";

@Controller('api/sharedspaces')
export class SharedspacesUsersContoller {
  constructor(
    private usersService: UsersService,
  ) {}
  
  @UseGuards(JwtAuthGuard)
  @Get(':SharedspaceId/users/search')
  searchUsers(
    @Param('SharedspaceId') SharedspaceId: string,
    @Query('query') query: string,
    @Query('before', UUIDv7OrEmptyPipe) beforeUserId: string,
  ) {
    return this.usersService.searchUsers(SharedspaceId, query, beforeUserId);
  }
}