import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { TSharedspaceRole } from "src/typings/types";

export class CreateSharedspaceMembersDTO {

  @IsNotEmpty()
  @IsNumber()
  UserId: number;

  @IsNotEmpty()
  @IsString()
  RoleName: TSharedspaceRole;
}