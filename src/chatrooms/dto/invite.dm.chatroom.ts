import { IsNotEmpty } from "class-validator";
import { IsUUIDv7Array } from "src/common/validator/IsUUIDv7Array";

export class InviteDmChatRoomDTO {

  @IsNotEmpty()
  @IsUUIDv7Array()
  targetUserIds: string[];
}