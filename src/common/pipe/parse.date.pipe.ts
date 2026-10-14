import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import dayjs, { Dayjs } from 'dayjs';
import { BAD_REQUEST_MESSAGE } from '../constant/error.message';

@Injectable()
export class ParseDayjsPipe implements PipeTransform<string> {
  constructor() {}

  transform(value: string): Dayjs | null {
    if (!value) {
      return null;
    }

    if (!dayjs(value).isValid()) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    return dayjs(value);
  }
}