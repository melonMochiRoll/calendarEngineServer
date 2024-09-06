import { IsNumber } from "class-validator";
import { IsExistSpace } from "src/common/validator/IsExistSpace";
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

  @IsExistSpace({
    message: '$property은 존재하지 않는 스페이스입니다.'
  })
  @IsNumber()
  SharedspaceId: number;
}