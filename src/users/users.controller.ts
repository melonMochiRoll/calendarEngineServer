import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { IsNotAuthenicatedGuard } from "src/auth/local.auth.guard";
import { User } from "src/common/decorator/user.decorator";
import { Users } from "src/entities/Users";
import { CreateUserDTO } from "./dto/create.user.dto";

@Controller('api/users')
export class UsersController {
  constructor(
    private usersService: UsersService,
  ) {}

  @Get()
  getUser(@User() user: Users) {
    return user || false;
  };

  @Get('email')
  isUser(@Query('e') email: string) {
    return this.usersService.isUser(email);
  };

  @UseGuards(IsNotAuthenicatedGuard)
  @Post()
  createUser(@Body() dto: CreateUserDTO) {
    return this.usersService.createUser(
      dto.email,
      dto.password,
    );
  };
}