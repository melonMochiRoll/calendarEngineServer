import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class SendInviteDTO {

  @IsNotEmpty()
  @IsUUID(7)
  SharedspaceId: string;

  @IsNotEmpty()
  @IsString()
  inviteeEmail: string;
}