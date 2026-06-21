import { IsNotEmpty, IsNumber, IsString, IsUUID } from "class-validator";

export class GenerateProfileImagePresignedPutUrlDTO {
  
  @IsNotEmpty()
  @IsUUID(7)
  id: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsNumber()
  @IsNotEmpty()
  fileSize: number;

  @IsString()
  @IsNotEmpty()
  contentType: string;
}