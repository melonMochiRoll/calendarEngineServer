import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreateUserDTO } from "./dto/create.user.dto";
import { SkipThrottle } from "@nestjs/throttler";
import { IsNotJwtAuthenicatedGuard, JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";

@SkipThrottle()
@Controller('api/users')
export class UsersController {
  constructor(
    private usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getUser(@User() user: Users) {
    return user || false;
  }

  @SkipThrottle({ default: false })
  @UseGuards(JwtAuthGuard)
  @Get('search')
  searchUsers(@Query('query') query: string) {
    return this.usersService.searchUsers(query);
  }

  @Get('email')
  isUser(@Query('e') email: string) {
    return this.usersService.isUser(email);
  }

  @UseGuards(IsNotJwtAuthenicatedGuard)
  @Post()
  createUser(@Body() dto: CreateUserDTO) {
    return this.usersService.createUser(dto);
  }
}