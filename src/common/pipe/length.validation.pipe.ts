import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { BAD_REQUEST_MESSAGE } from '../constant/error.message';

@Injectable()
export class LengthValidationPipe implements PipeTransform<string> {
  private valueLength: number;

  constructor(length: number) {
    this.valueLength = length;
  }

  transform(value: string): string {
    if (value.length !== this.valueLength) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    return value;
  }
}