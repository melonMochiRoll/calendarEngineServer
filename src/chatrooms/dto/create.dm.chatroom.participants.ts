import { IsNotEmpty } from "class-validator";
import { IsUUIDv7Array } from "src/common/validator/IsUUIDv7Array";

export class CreateDmChatRoomParticipantsDTO {

  @IsNotEmpty()
  @IsUUIDv7Array()
  targetUserIds: string[];
}