import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { BAD_REQUEST_MESSAGE } from '../constant/error.message';
import { SubscribedspacesFilter, TSubscribedspacesFilter } from 'src/typings/types';

@Injectable()
export class SubscribedFilterValidationPipe implements PipeTransform<TSubscribedspacesFilter> {
  transform(value: string): string {
    if (!this.isSubscribedspacesFilter(value)) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    return value;
  }

  private isSubscribedspacesFilter(value: any): value is TSubscribedspacesFilter {
    return Object.values(SubscribedspacesFilter).includes(value);
  }
}