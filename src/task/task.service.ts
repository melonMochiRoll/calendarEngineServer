import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { JOB_NAMES, JOB_STATUS } from "src/common/constant/constants";
import { chunking } from "src/common/function/utilFunctions";
import { BatchScheduler } from "src/entities/BatchScheduler";
import { Users } from "src/entities/Users";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(BatchScheduler)
    private batchSchedulerRepository: Repository<BatchScheduler>,
    private usersService: UsersService,
  ) {}
  
  @Cron('* 30 2 * * *')
  async processUserDeleteBatch() {
    const targetTasks = await this.batchSchedulerRepository.find({
      select: {
        job_params: true,
      },
      where: {
        job_name: JOB_NAMES.USER_DELETE,
        status: JOB_STATUS.PENDING,
      },
    });

    const taskChunks = chunking(targetTasks, 2);

    for (const chunk of taskChunks) {
      const batch = chunk.map(task => {
        const params: { UserId: number } = JSON.parse(task.job_params);
        return this.usersService.deleteRelations(task.id, params.UserId);
      });
      await Promise.all(batch);
    }
  }
}