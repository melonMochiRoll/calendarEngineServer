import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class DeleteSharedspaceChatDTO {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsUUID(7)
  id: string;
}