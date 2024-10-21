import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { IsNotExistEmail } from "src/common/validator/IsNotExistEmail";

export class CreateUserDTO {

  @IsNotExistEmail({
    message: '이미 존재하는 $property입니다.',
  })
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}