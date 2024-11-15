import { ArgumentMetadata, Injectable, NotFoundException, PipeTransform } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { IsNull, Repository } from "typeorm";
import { NOT_FOUND_SPACE_MESSAGE } from "../constant/error.message";

@Injectable()
export class TransformSpacePipe implements PipeTransform<string> {
  constructor(
    @InjectRepository(Sharedspaces)
    private sharedspacesRepository: Repository<Sharedspaces>,
  ) {}

  async transform(url: string) {
    const targetSpace = await this.sharedspacesRepository.findOneBy({ url });

    if (!targetSpace) {
      throw new NotFoundException(NOT_FOUND_SPACE_MESSAGE);
    }

    return targetSpace;
  }
}