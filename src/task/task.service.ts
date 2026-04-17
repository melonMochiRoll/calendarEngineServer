import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { JOB_NAMES, JOB_STATUS } from "src/common/constant/constants";
import { chunking } from "src/common/function/utilFunctions";
import { BatchScheduler } from "src/entities/BatchScheduler";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { UsersService } from "src/users/users.service";
import { Repository } from "typeorm";

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(BatchScheduler)
    private batchSchedulerRepository: Repository<BatchScheduler>,
    private usersService: UsersService,
    private sharedspacesService: SharedspacesService,
  ) {}
  
  @Cron('* 30 2 * * *')
  async processUserDeleteBatch() {
    const targetTasks = await this.batchSchedulerRepository.find({
      select: {
        id: true,
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

  @Cron('* 30 3 * * *')
  async processSharedspaceDeleteBatch() {
    const targetTasks = await this.batchSchedulerRepository.find({
      select: {
        id: true,
        job_params: true,
      },
      where: {
        job_name: JOB_NAMES.SHAREDSPACE_DELETE,
        status: JOB_STATUS.PENDING,
      },
    });

    const taskChunks = chunking(targetTasks, 2);

    for (const chunk of taskChunks) {
      const batch = chunk.map(task => {
        const params: { SharedspaceId: number } = JSON.parse(task.job_params);
        return this.sharedspacesService.deleteSharedspace(task.id, params.SharedspaceId);
      });
      await Promise.all(batch);
    }
  }
}