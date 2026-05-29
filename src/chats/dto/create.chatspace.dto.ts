import { IsNotEmpty, IsString } from "class-validator";

export class CreatChatspaceDTO {

  @IsString()
  @IsNotEmpty()
  targetUserId: string;
}