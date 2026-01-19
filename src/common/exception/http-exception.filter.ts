import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
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
      message: INTERNAL_SERVER_MESSAGE,
      timestamp: dayjs.utc().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      path: request.url,
      metaData: {},
    };

    if (this.isExceptionResponse(exceptionResponse)) {
      responseJson.message = exceptionResponse.message;
      responseJson.metaData = exceptionResponse.metaData || {};
    }

    response
      .status(status)
      .json(responseJson);
  }

  private isExceptionResponse(value: string | object): value is IErrorResponse {
    return (value as IErrorResponse).message !== undefined;
  }
}

