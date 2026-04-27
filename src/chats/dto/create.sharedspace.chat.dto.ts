import { IsArray, IsString } from "class-validator";

export class CreateSharedspaceChatDTO {

  @IsString()
  content: string;

  @IsArray()
  imageKeys: string[];
}