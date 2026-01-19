import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import dayjs from 'dayjs';
import { BAD_REQUEST_MESSAGE } from '../constant/error.message';

@Injectable()
export class DateValidationPipe implements PipeTransform<string> {
  constructor() {}

  transform(value: string): string {
    if (!dayjs(value, 'YYYY-MM-DD', true).isValid() && !dayjs(value, 'YYYY-MM', true).isValid()) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    return value;
  }
}