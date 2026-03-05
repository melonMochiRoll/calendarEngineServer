import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { UsersService } from "./users.service";

@Controller('api/sharedspaces')
export class SharedspacesUsersContoller {
  constructor(
    private usersService: UsersService,
  ) {}
  
  @UseGuards(JwtAuthGuard)
  @Get(':url/users/search')
  searchUsers(
    @Param('url') url: string,
    @Query('query') query: string,
    @Query('page', ParseIntPipe) page: number,
  ) {
    return this.usersService.searchUsers(url, query, page);
  }
}