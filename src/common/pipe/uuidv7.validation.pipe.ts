import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { BAD_REQUEST_MESSAGE } from "../constant/error.message";

@Injectable()
export class UUIDv7ValidationPipe implements PipeTransform<string>{
  private uuidv7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  transform(value: string): string {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    return this.uuidv7Regex.test(value) ? value : '';
  }
}