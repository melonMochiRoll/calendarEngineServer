import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { IsExistTodo } from "src/common/validator/IsExistTodo";
import { IsExistUser } from "src/common/validator/IsExistUser";
import { IsTimeFormat } from "src/common/validator/IsTimeFormat";

export class UpdateTodoDto {

  @IsExistTodo({
    message: '해당 $property은 존재하지 않는 컨텐츠입니다.'
  })
  @Type(() => Number)
  id: number;

  @IsString()
  @IsNotEmpty()
  description: string;

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
  EditorId: number;
};