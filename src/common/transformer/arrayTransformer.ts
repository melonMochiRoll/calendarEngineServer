import { ValueTransformer } from "typeorm";

export class ArrayTransformer implements ValueTransformer {
  
  to(value: string[]) {
    return value ? value.join(',') : '';
  }

  from(value: string) {
    return value ? value.split(',') : [];
  }
}