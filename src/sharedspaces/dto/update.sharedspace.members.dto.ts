import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class UpdateSharedspaceMembersDTO {

  @IsNotEmpty()
  @IsNumber()
  UserId: number;

  @IsNotEmpty()
  @IsString()
  RoleName: string;
}