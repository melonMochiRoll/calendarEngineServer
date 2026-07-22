import { IsArray, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class SendSharedspacechatDTO {

  @IsNotEmpty()
  @IsUUID(7)
  id: string;

  @IsNotEmpty()
  @IsUUID(7)
  ChatId: string;

  @IsString()
  content: string;

  @IsArray()
  imageIds: string[];

  @IsArray()
  imageKeys: string[]
}