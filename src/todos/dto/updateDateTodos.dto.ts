import { IsBoolean, IsInt, IsNotEmpty, IsString } from "class-validator";

export class UpdateDateTodosDto {

  @IsNotEmpty()
  @IsInt()
  todosId: number;

  @IsNotEmpty()
  @IsString()
  contents: string;

  @IsNotEmpty()
  @IsBoolean()
  isComplete: boolean;

  @IsNotEmpty()
  @IsString()
  date: string;
};