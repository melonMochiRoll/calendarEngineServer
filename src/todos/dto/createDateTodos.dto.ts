import { IsNotEmpty, IsString } from "class-validator";

export class CreateDateTodosDto {

  @IsNotEmpty()
  @IsString()
  contents: string;

  @IsNotEmpty()
  @IsString()
  date: string;
};