import { ValueTransformer } from "typeorm";
import { getR2PublicURL } from "../function/utilFunctions";

export class ImagePathTransformer implements ValueTransformer {

  to(value: string) {
    return value;
  }

  from(value: Buffer) {
    if (!value) {
      return;
    }

    return `${getR2PublicURL()}/${value}`;
  }
}