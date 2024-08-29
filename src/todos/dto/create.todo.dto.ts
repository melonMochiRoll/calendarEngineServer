import { IsDateString, IsNotEmpty, IsNumber, MaxLength } from "class-validator";
import { IsSpaceAlreadyExist } from "src/common/validator/IsSpaceAlreadyExist";
import { IsTimeFormat } from "src/common/validator/IsTimeFormat";
import { IsUserAlreadyExist } from "src/common/validator/IsUserAlreadyExist";

export class CreateTodoDTO {

  @MaxLength(1000, {
    message: '$property의 길이는 $constraint1자를 넘을 수 없습니다.',
  })
  @IsNotEmpty()
  description: string;

  @IsDateString({ strict: true }, {
    message: '$property는 Date형식이 아닙니다.'
  })
  @IsNotEmpty()
  date: Date;

  @IsTimeFormat({
    message: '$property은 Time형식이 아닙니다.'
  })
  @IsNotEmpty()
  startTime: string;

  @IsTimeFormat({
    message: '$property은 Time형식이 아닙니다.'
  })
  @IsNotEmpty()
  endTime: string;

  @IsUserAlreadyExist({
    message: '$property은 존재하지 않는 회원입니다.'
  })
  @IsNumber()
  @IsNotEmpty()
  AuthorId: number;

  @IsSpaceAlreadyExist({
    message: '$property은 존재하지 않는 스페이스입니다.'
  })
  @IsNumber()
  @IsNotEmpty()
  SharedspaceId: number;
}