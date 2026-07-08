import { Controller } from "@nestjs/common";
import { FriendshipsService } from "./friendships.service ";

@Controller('api/friendships')
export class FriendshipsController {
  constructor(
    private friendshipsService: FriendshipsService
  ) {}
}