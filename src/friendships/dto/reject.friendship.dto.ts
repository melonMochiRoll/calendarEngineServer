import { IsNotEmpty, IsUUID } from "class-validator";

export class RejectFriendshipDTO {

  @IsNotEmpty()
  @IsUUID(7)
  RequesterId: string;
}