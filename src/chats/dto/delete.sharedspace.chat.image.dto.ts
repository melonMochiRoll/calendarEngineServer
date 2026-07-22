import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class DeleteSharedspaceChatImageDTO {
  @IsNotEmpty()
  @IsUUID(7)
  id: string;

  @IsNotEmpty()
  @IsUUID(7)
  ChatId: string;

  @IsNotEmpty()
  @IsUUID(7)
  ImageId: string;
}