import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { chunking } from "src/common/function/utilFunctions";
import { Users } from "src/entities/Users";
import { UserStatus } from "src/typings/types";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    private usersService: UsersService,
  ) {}
  
  @Cron('* 30 2 * * *')
  async processUserDeleteBatch() {
    const targetUsers = await this.usersRepository.find({
      where: {
        status: UserStatus.DELETING_PENDING,
      },
    });

    const userChunks = chunking(targetUsers, 2);

    for (const chunk of userChunks) {
      const batch = chunk.map(user => this.usersService.deleteRelations(user.id));
      await Promise.all(batch);
    }
  }
}