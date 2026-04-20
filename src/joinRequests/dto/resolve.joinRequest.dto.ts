import { IsNotEmpty, IsString } from "class-validator";
import { TSharedspaceRole } from "src/typings/types";

export class ResolveJoinRequestDTO {
  
  @IsNotEmpty()
  @IsString()
  RoleName: TSharedspaceRole;
}