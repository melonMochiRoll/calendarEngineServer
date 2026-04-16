import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { TSharedspaceRole } from "src/typings/types";

export class UpdateSharedspaceMembersDTO {

  @IsNotEmpty()
  @IsNumber()
  UserId: number;

  @IsNotEmpty()
  @IsString()
  RoleName: TSharedspaceRole;
}