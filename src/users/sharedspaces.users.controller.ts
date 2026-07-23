import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";
import { UsersService } from "./users.service";
import { UUIDv7OrEmptyPipe } from "src/common/pipe/uuidv7OrEmpty.pipe";

@Controller('api/sharedspaces')
export class SharedspacesUsersContoller {
  constructor(
    private usersService: UsersService,
  ) {}
}