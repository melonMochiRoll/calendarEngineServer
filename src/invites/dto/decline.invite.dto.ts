import { IsNotEmpty, IsUUID } from "class-validator";

export class DeclineInviteDTO {
  
  @IsNotEmpty()
  @IsUUID(7)
  id: string;
}