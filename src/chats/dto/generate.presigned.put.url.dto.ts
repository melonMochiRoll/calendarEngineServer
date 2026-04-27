import { IsArray } from "class-validator";

export class GeneratePresignedPutUrlDTO {

  @IsArray()
  metaDatas: Array<{ id: string, fileName: string, fileSize: number, contentType: string }>;
}