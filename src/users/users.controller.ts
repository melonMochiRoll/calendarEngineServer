import { Body, Controller, Delete, Get, Post, Query, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UserId } from "src/common/decorator/userId.decorator";
import { CreateUserDTO } from "./dto/create.user.dto";
import { IsNotJwtAuthenicatedGuard, JwtAuthGuard, PublicAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { CSRFAuthGuard } from "src/auth/authGuard/csrf.auth.guard";
import { GenerateProfileImagePresignedPutUrlDTO } from "./dto/generate.profileImage.presigned.put.url.dto";
import { UpdateProfileImageDTO } from "./dto/update.profile.image.dto";
import { UsersFetcher } from "./users.fetcher";

@Controller('api/users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private usersFetcher: UsersFetcher,
  ) {}

  @UseGuards(PublicAuthGuard)
  @Get()
  getUser(@UserId() UserId: string | null) {
    return UserId ? this.usersFetcher.getUserById(UserId) : null;
  }

  @Get('email')
  existsByEmail(@Query('e') email: string) {
    return this.usersService.existsByEmail(email);
  }

  @Get('nickname')
  existsByNickname(@Query('n') nickname: string) {
    return this.usersService.existsByNickname(nickname);
  }

  @UseGuards(IsNotJwtAuthenicatedGuard)
  @Post()
  createUser(@Body() dto: CreateUserDTO) {
    return this.usersService.createUser(dto);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Delete()
  scheduleUserDeletion(@UserId() UserId: string) {
    return this.usersService.scheduleUserDeletion(UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('profileimages/presigned-url')
  generateProfileImagePresignedPutUrl(
    @Body() dto: GenerateProfileImagePresignedPutUrlDTO,
    @UserId() UserId: string,
  ) {
    return this.usersService.generateProfileImagePresignedPutUrl(dto, UserId);
  }

  @UseGuards(JwtAuthGuard, CSRFAuthGuard)
  @Post('profileimages')
  updateProfileImage(
    @Body() dto: UpdateProfileImageDTO,
    @UserId() UserId: string,
  ) {
    return this.usersService.updateProfileImage(dto, UserId);
  }
}