import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class UpdateSharedspaceOwnerDTO {
  
  @IsNotEmpty()
  @IsUUID(7)
  newOwnerId: string;
}