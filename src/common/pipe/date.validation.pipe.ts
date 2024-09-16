import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { BAD_REQUEST_MESSAGE } from '../constant/error.message';

@Injectable()
export class DateValidationPipe implements PipeTransform<string> {
  constructor() {
    dayjs.extend(customParseFormat);
  }

  transform(value: string): string {
    if (!dayjs(value, 'YYYY-MM', true).isValid()) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    return value;
  }
}