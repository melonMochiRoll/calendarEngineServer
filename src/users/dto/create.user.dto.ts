import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { IsEmailAlreadyExist } from "src/common/validator/IsEmailAlreadyExist";

export class CreateUserDTO {

  @IsEmailAlreadyExist({
    message: '이미 존재하는 $property입니다.',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}