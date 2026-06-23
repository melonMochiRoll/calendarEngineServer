import { IsNotEmpty, IsUUID } from "class-validator";

export class CreatChatspaceDTO {

  @IsNotEmpty()
  @IsUUID(7)
  targetUserId: string;
}