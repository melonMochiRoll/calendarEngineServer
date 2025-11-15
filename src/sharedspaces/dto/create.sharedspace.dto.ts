import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateSharedspaceDTO {

  @IsNotEmpty()
  @IsNumber()
  OwnerId: number;
}