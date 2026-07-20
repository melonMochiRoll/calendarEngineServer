import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateChatRoomForDmDTO {

  @IsNotEmpty()
  @IsUUID(7)
  targetUserId: string;
}