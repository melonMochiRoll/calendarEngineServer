import { IsNotEmpty, IsNumber } from "class-validator";

export class DeclineInviteDTO {
  
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  url: string;
}