import { HttpException, InternalServerErrorException } from "@nestjs/common";

const handleError = (err: unknown) => {
  if (err instanceof HttpException) {
    throw new HttpException(err.getResponse(), err.getStatus());
  }
  throw new InternalServerErrorException(err);
};

export default handleError;