import { IsArray, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class SendChatspaceChatDTO {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsUUID(7)
  ChatId: string;

  @IsString()
  content: string;

  @IsArray()
  imageIds: string[];
}