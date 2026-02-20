import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import dayjs from 'dayjs';
import { INTERNAL_SERVER_MESSAGE } from '../constant/error.message';
import { IErrorResponse } from 'src/typings/types';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor() {}

  catch(exception: HttpException, host: ArgumentsHost) {
    console.error(exception);
    
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const responseJson = {
      code: `${status}-${request.url}`,
      message: exception.message,
      timestamp: dayjs.utc().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      path: request.url,
      metaData: this.hasMetaData(exceptionResponse) ? exceptionResponse.metaData : {},
    };

    response
      .status(status)
      .json(responseJson);
  }

  private hasMetaData(value: string | object): value is IErrorResponse {
    return typeof value === 'object' && value.hasOwnProperty('metaData');
  }
}

