import { IsNotEmpty, IsUUID } from "class-validator";

export class AcceptFriendshipDTO {

  @IsNotEmpty()
  @IsUUID(7)
  id: string;

  @IsNotEmpty()
  @IsUUID(7)
  RequesterId: string;
}