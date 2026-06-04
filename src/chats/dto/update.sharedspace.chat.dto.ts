import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class UpdateSharedspaceChatDTO {

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsUUID(7)
  ChatId: string;
  
  @IsNotEmpty()
  @IsString()
  content: string;
}