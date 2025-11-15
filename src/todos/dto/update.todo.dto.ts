import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { IsTimeFormat } from "src/common/validator/IsTimeFormat";

export class UpdateTodoDto {

  @IsNotEmpty()
  @IsNumber()
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

  @IsNotEmpty()
  @IsNumber()
  EditorId: number;
};