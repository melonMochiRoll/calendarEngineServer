import { IsArray } from "class-validator";

export class GeneratePresignedPutUrlDTO {

  @IsArray()
  metaDatas: Array<{ fileName: string, fileSize: number, contentType: string }>;
}