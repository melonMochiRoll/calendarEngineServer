import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateDmChatRoomDTO {

  @IsNotEmpty()
  @IsUUID(7)
  targetUserId: string;
}