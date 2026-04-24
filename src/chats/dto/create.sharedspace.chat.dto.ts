import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class CreateSharedspaceChatDTO {

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsArray()
  imageKeys: string[];
}