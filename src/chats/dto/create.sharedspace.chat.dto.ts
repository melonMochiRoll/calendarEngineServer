import { IsArray, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateSharedspaceChatDTO {

  @IsNotEmpty()
  @IsUUID(7)
  id: string;

  @IsString()
  content: string;

  @IsArray()
  imageIds: string[];
}