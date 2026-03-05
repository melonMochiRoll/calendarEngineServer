import { IsNotEmpty, IsNumber } from "class-validator";

export class UpdateSharedspaceOwnerDTO {
  
  @IsNotEmpty()
  @IsNumber()
  newOwnerId: number;
}