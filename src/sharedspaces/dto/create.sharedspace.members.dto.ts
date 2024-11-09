import { Type } from "class-transformer";
import { IsString } from "class-validator";
import { IsExistRole } from "src/common/validator/IsExistRole";
import { IsExistUser } from "src/common/validator/IsExistUser";

export class CreateSharedspaceMembersDTO {

  @IsExistUser({
    message: '$property는 존재하지 않는 회원입니다.'
  })
  @Type(() => Number)
  UserId: number;

  @IsExistRole({
    message: '$property는 유효하지 않는 등급입니다.'
  })
  @IsString()
  RoleName: string;
}