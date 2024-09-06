import { IsNumber, IsString, MaxLength } from "class-validator";
import { IsExistUser } from "src/common/validator/IsExistUser";

export class CreateSharedspaceDTO {

  @MaxLength(30, {
    message: '$property의 길이는 $constraint1자를 넘을 수 없습니다.',
  })
  @IsString()
  name: string;

  @IsExistUser({
    message: '$property은 존재하지 않는 회원입니다.'
  })
  @IsNumber()
  OwnerId: number;
}