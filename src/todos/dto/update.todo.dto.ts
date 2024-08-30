import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { IsTimeFormat } from "src/common/validator/IsTimeFormat";
import { IsTodoAlreadyExist } from "src/common/validator/IsTodoAlreadyExist";
import { IsUserAlreadyExist } from "src/common/validator/IsUserAlreadyExist";

export class UpdateTodoDto {

  @IsTodoAlreadyExist({
    message: '해당 $property은 존재하지 않는 컨텐츠입니다.'
  })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  description: string;

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
  EditorId: number;
};