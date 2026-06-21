import { IsNotEmpty, IsUUID } from "class-validator";

export class UpdateProfileImageDTO {
  @IsNotEmpty()
  @IsUUID(7)
  ImageId: string;
}