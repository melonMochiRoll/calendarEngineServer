import { IsNotEmpty, IsString } from "class-validator";

export class UpdateProfileImageDTO {
  @IsNotEmpty()
  @IsString()
  ImageId: string;
}