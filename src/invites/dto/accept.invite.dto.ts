import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class AcceptInviteDTO {

  @IsNotEmpty()
  @IsUUID(7)
  id: string;

  @IsNotEmpty()
  @IsUUID(7)
  SharedspaceId: string;
}