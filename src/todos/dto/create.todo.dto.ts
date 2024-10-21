import { Type } from "class-transformer";
import { IsDateString, IsNotEmpty, IsNumber, MaxLength } from "class-validator";
import { IsExistUser } from "src/common/validator/IsExistUser";
import { IsTimeFormat } from "src/common/validator/IsTimeFormat";

export class CreateTodoDTO {

  @MaxLength(1000, {
    message: '$property의 길이는 $constraint1자를 넘을 수 없습니다.',
  })
  description: string;

  @IsDateString({ strict: true }, {
    message: '$property는 Date형식이 아닙니다.'
  })
  date: Date;

  @IsTimeFormat({
    message: '$property은 Time형식이 아닙니다.'
  })
  startTime: string;

  @IsTimeFormat({
    message: '$property은 Time형식이 아닙니다.'
  })
  endTime: string;

  @IsExistUser({
    message: '$property은 존재하지 않는 회원입니다.'
  })
  @Type(() => Number)
  AuthorId: number;
}