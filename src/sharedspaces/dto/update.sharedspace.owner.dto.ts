import { IsNumber } from "class-validator";
import { IsExistUser } from "src/common/validator/IsExistUser";

export class UpdateSharedspaceOwnerDTO {

  @IsExistUser({
    message: '$property은 존재하지 않는 회원입니다.'
  })
  @IsNumber()
  OwnerId: number;

  @IsExistUser({
    message: '$property은 존재하지 않는 회원입니다.'
  })
  @IsNumber()
  newOwnerId: number;
}