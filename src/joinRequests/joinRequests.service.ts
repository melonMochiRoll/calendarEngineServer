import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { Users } from "src/entities/Users";
import { CreateJoinRequestDTO } from "./dto/create.joinRequest.dto";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JoinRequests } from "src/entities/JoinRequests";
import handleError from "src/common/function/handleError";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { BAD_REQUEST_MESSAGE, CONFLICT_MESSAGE } from "src/common/constant/error.message";

@Injectable()
export class JoinRequestsService {
  constructor(
    @InjectRepository(JoinRequests)
    private joinRequestsRepository: Repository<JoinRequests>,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembers: Repository<SharedspaceMembers>,
  ) {}
  
  async createJoinRequest(
    targetSpace: Sharedspaces,
    dto: CreateJoinRequestDTO,
    user: Users,
  ) {
    try {
      const isMember = await this.sharedspaceMembers.findOneBy({ UserId: user.id, SharedspaceId: targetSpace.id });

      if (isMember?.RoleName === dto.RoleName) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }

      await this.joinRequestsRepository.save({
        SharedspaceId: targetSpace.id,
        RequestorId: user.id,
        RoleName: dto.RoleName,
      });
    } catch (err) {
      handleError(err);
    }

    return true;
  }

  async deleteJoinRequest(
    targetSpace: Sharedspaces,
    targetJoinRequest: JoinRequests,
    user: Users,
  ) {
    try {
      if (
        targetSpace.id !== targetJoinRequest.SharedspaceId ||
        user.id !== targetJoinRequest.RequestorId
      ) {
        throw new BadRequestException(BAD_REQUEST_MESSAGE);
      }

      await this.joinRequestsRepository.delete({ id: targetJoinRequest.id });
    } catch (err) {
      handleError(err);
    }

    return true;
  }
}