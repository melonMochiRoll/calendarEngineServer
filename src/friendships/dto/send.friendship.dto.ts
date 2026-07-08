import { IsNotEmpty, IsUUID } from "class-validator";

export class SendFriendshipDTO {

  @IsNotEmpty()
  @IsUUID(7)
  RequesteeId: string;
}