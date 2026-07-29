import { IsNotEmpty, IsString } from "class-validator";

export class CreateSharedspaceChatRoomDTO {

  @IsNotEmpty()
  @IsString()
  name: string;
}