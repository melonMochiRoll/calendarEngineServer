import { ValueTransformer } from "typeorm";

export class UUIDV7Transformer implements ValueTransformer {

  to(value: string) {
    if (!value) {
      return;
    }

    return Buffer.from(value.replace(/-/g, ''), 'hex');
  }

  from(value: Buffer) {
    if (!value) {
      return;
    }

    const hex = value.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}

export const uuidToString = (value: Buffer) => {
  if (!value) {
    return;
  }

  const hex = value.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};