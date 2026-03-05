import { IsNotEmpty } from "class-validator";

export class SendInviteDTO {

  @IsNotEmpty()
  url: string;

  @IsNotEmpty()
  inviteeEmail: string;
}