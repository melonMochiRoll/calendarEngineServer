import { IsDate, IsNotEmpty, IsNumber, MaxLength } from "class-validator";

export class CreateTodoDTO { // TODO : 커스텀 데코데이터 적용해보기

  @MaxLength(1000)
  @IsNotEmpty()
  description: string;

  @IsDate()
  @IsNotEmpty()
  date: Date;

  @IsNotEmpty()
  startTime: string;

  @IsNotEmpty()
  endTime: string;

  @IsNumber()
  @IsNotEmpty()
  AuthorId: number;

  @IsNumber()
  @IsNotEmpty()
  SharedspaceId: number;
}