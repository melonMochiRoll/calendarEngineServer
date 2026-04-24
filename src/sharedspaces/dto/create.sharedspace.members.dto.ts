import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import { TSharedspaceRole } from "src/typings/types";

export class CreateSharedspaceMembersDTO {

  @IsNotEmpty()
  @IsUUID(7)
  UserId: string;

  @IsNotEmpty()
  @IsString()
  RoleName: TSharedspaceRole;
}