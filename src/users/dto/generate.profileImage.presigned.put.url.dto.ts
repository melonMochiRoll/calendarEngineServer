import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class GenerateProfileImagePresignedPutUrlDTO {
  
  @IsString()
  @IsNotEmpty()
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