import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import dayjs from "dayjs";
import { IMAGE_STATUS, JOB_NAMES, JOB_STATUS } from "src/common/constant/constants";
import { chunking } from "src/common/function/utilFunctions";
import { BatchScheduler } from "src/entities/BatchScheduler";
import { Images } from "src/entities/Images";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { StorageR2Service } from "src/storage/storage.r2.service";
import { UsersService } from "src/users/users.service";
import { LessThan, Repository } from "typeorm";

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(BatchScheduler)
    private batchSchedulerRepository: Repository<BatchScheduler>,
    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
    private usersService: UsersService,
    private sharedspacesService: SharedspacesService,
    private storageR2Service: StorageR2Service,
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

  @Cron('0 0 3 * * *')
  async cleanupOrphanedImages() {
    const ONE_HOUR_AGO = dayjs().subtract(1, 'hour').toDate();

    const orphanedImages = await this.imagesRepository.find({
      select: {
        path: true,
      },
      where: {
        status: IMAGE_STATUS.PENDING,
        createdAt: LessThan(ONE_HOUR_AGO),
      }
    });

    const imageChunks = chunking(orphanedImages, 2);

    for (const chunk of imageChunks) {
      const batch = chunk.map(image => this.storageR2Service.deleteFile(image.path));
      await Promise.all(batch);
    }
  }
}