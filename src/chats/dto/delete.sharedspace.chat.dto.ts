import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class DeleteSharedspaceChatDTO {
  @IsNotEmpty()
  @IsUUID(7)
  id: string;

  @IsNotEmpty()
  @IsUUID(7)
  ChatId: string;
}