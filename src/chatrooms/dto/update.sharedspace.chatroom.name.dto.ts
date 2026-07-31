import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class UpdateSharedspaceChatRoomNameDTO {
  @IsNotEmpty()
  @IsUUID(7)
  ChatRoomId: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}