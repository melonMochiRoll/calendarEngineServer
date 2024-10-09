import { Type } from "class-transformer";
import { IsExistUser } from "src/common/validator/IsExistUser";

export class CreateSharedspaceDTO {

  @IsExistUser({
    message: '$property은 존재하지 않는 회원입니다.'
  })
  @Type(() => Number)
  OwnerId: number;
}