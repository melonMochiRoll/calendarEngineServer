import { IsNotEmpty, IsNumber } from "class-validator";

export class AcceptInviteDTO {

  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  url: string;
}