import { IsExistRole } from "src/common/validator/IsExistRole";

export class CreateJoinRequestDTO {
  
  @IsExistRole({
    message: '$property는 유효하지 않는 등급입니다.'
  })
  RoleName: string;
}