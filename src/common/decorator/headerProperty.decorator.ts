import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const HeaderProperty = createParamDecorator(
  (property: string, ctx: ExecutionContext) => {
    const headers = ctx.switchToHttp().getRequest().headers;

    return headers[property];
  },
);