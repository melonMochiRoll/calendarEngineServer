import { PipeTransform } from "@nestjs/common";

export class UUIDv7OrEmptyPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    const uuidv7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidv7Regex.test(value) ? value : '';
  }
}