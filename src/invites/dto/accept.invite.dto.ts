import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class AcceptInviteDTO {

  @IsNotEmpty()
  @IsUUID(7)
  id: string;

  @IsNotEmpty()
  @IsString()
  url: string;
}