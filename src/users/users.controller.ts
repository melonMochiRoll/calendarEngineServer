import { Body, Controller, Delete, Get, Post, Query, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreateUserDTO } from "./dto/create.user.dto";
import { IsNotJwtAuthenicatedGuard, JwtAuthGuard, PublicAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";

@Controller('api/users')
export class UsersController {
  constructor(
    private usersService: UsersService,
  ) {}

  @UseGuards(PublicAuthGuard)
  @Get()
  getUser(@User() user: Users) {
    return user || false;
  }

  @Get('email')
  existsByEmail(@Query('e') email: string) {
    return this.usersService.existsByEmail(email);
  }

  @UseGuards(IsNotJwtAuthenicatedGuard)
  @Post()
  createUser(@Body() dto: CreateUserDTO) {
    return this.usersService.createUser(dto);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Delete()
  deleteUser(@User() user: Users) {
    return this.usersService.deleteUser(user.id);
  }
}