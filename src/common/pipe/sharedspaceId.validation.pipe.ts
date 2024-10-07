import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { BAD_REQUEST_MESSAGE } from '../constant/error.message';
import { InjectRepository } from '@nestjs/typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { Repository } from 'typeorm';

@Injectable()
export class SharedspaceIdValidationPipe implements PipeTransform<number> {
  constructor(
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
  ) {}

  async transform(value: number) {
    if (typeof value !== 'number' || !await this.isSharedspace(value)) {
      throw new BadRequestException(BAD_REQUEST_MESSAGE);
    }

    return value;
  }

  private async isSharedspace(id: number) {
    return await this.sharedspacesRepository.findOneByOrFail({ id })
      .then(() => true)
      .catch(() => false);
  }
}