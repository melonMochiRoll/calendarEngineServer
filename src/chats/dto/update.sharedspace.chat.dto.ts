import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class UpdateSharedspaceChatDTO {

  @IsNotEmpty()
  @IsUUID(7)
  ChatId: string;
  
  @IsNotEmpty()
  @IsString()
  content: string;
}