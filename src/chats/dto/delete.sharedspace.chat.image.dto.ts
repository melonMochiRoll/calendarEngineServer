import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class DeleteSharedspaceChatImageDTO {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsUUID(7)
  ChatId: string;

  @IsNotEmpty()
  @IsUUID(7)
  ImageId: string;
}