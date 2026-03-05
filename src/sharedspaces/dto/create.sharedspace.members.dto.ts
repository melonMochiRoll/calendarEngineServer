import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateSharedspaceMembersDTO {

  @IsNotEmpty()
  @IsNumber()
  UserId: number;

  @IsNotEmpty()
  @IsString()
  RoleName: string;
}