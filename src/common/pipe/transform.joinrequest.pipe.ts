import { Injectable, NotFoundException, PipeTransform } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JoinRequests } from "src/entities/JoinRequests";
import { NOT_FOUND_RESOURCE } from "../constant/error.message";

@Injectable()
export class TransformJoinRequestsPipe implements PipeTransform<string> {
  constructor(
    @InjectRepository(JoinRequests)
    private joinRequestsRepository: Repository<JoinRequests>,
  ) {}

  async transform(id: string) {
    const isValid = await this.joinRequestsRepository.findOneBy({ id: Number(id) });

    if (!isValid) {
      throw new NotFoundException(NOT_FOUND_RESOURCE);
    }

    return isValid;
  }
}