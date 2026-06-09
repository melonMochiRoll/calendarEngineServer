import { ValueTransformer } from "typeorm";

export class ImagePathTransformer implements ValueTransformer {

  to(value: string) {
    return value;
  }

  from(value: Buffer) {
    if (!value) {
      return;
    }

    return `${process.env.R2_PUBLIC_URL}/${value}`;
  }
}