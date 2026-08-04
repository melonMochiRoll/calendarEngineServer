import { IsNotEmpty, IsString } from "class-validator";

export class UpdateSharedspaceChatRoomNameDTO {

  @IsNotEmpty()
  @IsString()
  name: string;
}