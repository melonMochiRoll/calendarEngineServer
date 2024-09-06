import { IsNumber, IsString, MaxLength } from "class-validator";
import { IsExistSpace } from "src/common/validator/IsExistSpace";

export class UpdateSharedspaceNameDTO {

  @MaxLength(30, {
    message: '$property의 길이는 $constraint1자를 넘을 수 없습니다.',
  })
  @IsString()
  name: string;

  @IsExistSpace({
    message: '$property은 존재하지 않는 스페이스입니다.'
  })
  @IsNumber()
  SharedspaceId: number;
}