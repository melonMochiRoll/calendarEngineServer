import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { INTERNAL_SERVER_MESSAGE } from '../constant/errorMessages';
import { IErrorResponse } from 'src/typings/types';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    console.error(exception);
    
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const rest = isExceptionResponse(exceptionResponse) ?
      exceptionResponse :
      { message: INTERNAL_SERVER_MESSAGE, error: 'Uncatched Error', statusCode: status };

    response
      .status(status)
      .json({
        ...rest,
        timestamp: dayjs.utc().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        path: request.url
      });
  }
}

function isExceptionResponse(value: string | object): value is IErrorResponse {
  return (value as IErrorResponse).message !== undefined &&
    (value as IErrorResponse).error !== undefined &&
    (value as IErrorResponse).statusCode !== undefined;
}