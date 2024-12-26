import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { IsAuthenicatedGuard, IsNotAuthenicatedGuard } from "src/auth/authGuard/local.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreateUserDTO } from "./dto/create.user.dto";
import { SkipThrottle } from "@nestjs/throttler";

@SkipThrottle()
@Controller('api/users')
export class UsersController {
  constructor(
    private usersService: UsersService,
  ) {}

  @Get()
  getUser(@User() user: Users) {
    return user || false;
  }

  @SkipThrottle({ default: false })
  @UseGuards(IsAuthenicatedGuard)
  @Get('search')
  searchUsers(@Query('query') query: string) {
    return this.usersService.searchUsers(query);
  }

  @Get('email')
  isUser(@Query('e') email: string) {
    return this.usersService.isUser(email);
  }

  @UseGuards(IsNotAuthenicatedGuard)
  @Post()
  createUser(@Body() dto: CreateUserDTO) {
    return this.usersService.createUser(dto);
  }
}