import { IsString, MaxLength } from "class-validator";

export class UpdateSharedspaceNameDTO {

  @MaxLength(30, {
    message: '$property의 길이는 $constraint1자를 넘을 수 없습니다.',
  })
  @IsString()
  name: string;
}