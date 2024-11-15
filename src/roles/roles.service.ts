import { ConflictException, Injectable } from "@nestjs/common";
import handleError from "src/common/function/handleError";
import { CreateRoleDTO } from "./dto/create.role.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Roles } from "src/entities/Roles";
import { Repository } from "typeorm";
import { CONFLICT_MESSAGE } from "src/common/constant/error.message";

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Roles)
    private rolesRepository: Repository<Roles>,
  ) {}
  
  async createRole(dto: CreateRoleDTO) {
    try {
      const isExist = await this.rolesRepository.findOneBy({ name: dto.name });

      if (isExist) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      await this.rolesRepository.save({
        name: dto.name,
      });
    } catch (err) {
      handleError(err);
    }
  }
}