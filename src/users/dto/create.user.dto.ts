import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateUserDTO {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}