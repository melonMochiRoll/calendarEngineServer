import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { INTERNAL_SERVER_MESSAGE } from '../constant/error.message';
import { IErrorResponse } from 'src/typings/types';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor() {
    dayjs.extend(utc);
    dayjs.extend(timezone);
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    console.error(exception);
    
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message = this.isExceptionResponse(exceptionResponse) ?
      exceptionResponse.message :
      INTERNAL_SERVER_MESSAGE;

    response
      .status(status)
      .json({
        message,
        timestamp: dayjs.utc().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        path: request.url
      });
  }

  private isExceptionResponse(value: string | object): value is IErrorResponse {
    return (value as IErrorResponse).message !== undefined &&
      (value as IErrorResponse).error !== undefined &&
      (value as IErrorResponse).statusCode !== undefined;
  }
}

