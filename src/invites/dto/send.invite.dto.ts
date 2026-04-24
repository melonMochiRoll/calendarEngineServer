import { IsNotEmpty, IsString } from "class-validator";

export class SendInviteDTO {

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  inviteeEmail: string;
}