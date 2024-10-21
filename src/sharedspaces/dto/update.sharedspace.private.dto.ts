import { Type } from "class-transformer";
import { IsBoolean } from "class-validator";

export class UpdateSharedspacePrivateDTO {

  @IsBoolean()
  @Type(() => Boolean)
  private: boolean;
}