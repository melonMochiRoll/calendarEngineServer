import { IsNotEmpty, IsString } from "class-validator";

export class ResolveJoinRequestDTO {
  
  @IsNotEmpty()
  @IsString()
  RoleName: string;
}