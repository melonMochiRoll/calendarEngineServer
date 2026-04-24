import { IsNotEmpty, IsString } from "class-validator";

export class CreateJoinRequestDTO {

  @IsNotEmpty()
  @IsString()
  message: string;
}