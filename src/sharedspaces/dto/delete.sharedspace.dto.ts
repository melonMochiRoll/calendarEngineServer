import { IsNumber } from "class-validator";
import { IsExistSpace } from "src/common/validator/IsExistSpace";

export class DeleteSharedspaceDTO {
  
  @IsExistSpace({
    message: '$property은 존재하지 않는 스페이스입니다.'
  })
  @IsNumber()
  SharedspaceId: number;
}