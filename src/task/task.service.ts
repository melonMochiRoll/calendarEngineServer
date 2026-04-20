import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import dayjs from "dayjs";
import { IMAGE_STATUS, INVITE_STATUS, JOB_NAMES, JOB_STATUS } from "src/common/constant/constants";
import { chunking } from "src/common/function/utilFunctions";
import { BatchScheduler } from "src/entities/BatchScheduler";
import { Chats } from "src/entities/Chats";
import { Images } from "src/entities/Images";
import { Invites } from "src/entities/Invites";
import { JoinRequests } from "src/entities/JoinRequests";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { Todos } from "src/entities/Todos";
import { SharedspacesService } from "src/sharedspaces/sharedspaces.service";
import { StorageR2Service } from "src/storage/storage.r2.service";
import { UsersService } from "src/users/users.service";
import { DataSource, IsNull, LessThan, Not, Repository } from "typeorm";

@Injectable()
export class TaskService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(BatchScheduler)
    private batchSchedulerRepository: Repository<BatchScheduler>,
    @InjectRepository(Images)
    private imagesRepository: Repository<Images>,
    @InjectRepository(Todos)
    private todosRepository: Repository<Todos>,
    @InjectRepository(Chats)
    private chatsRepository: Repository<Chats>,
    @InjectRepository(Invites)
    private invitesRepository: Repository<Invites>,
    @InjectRepository(SharedspaceMembers)
    private sharedspaceMembersRepository: Repository<SharedspaceMembers>,
    @InjectRepository(JoinRequests)
    private joinRequestsRepository: Repository<JoinRequests>,
    private usersService: UsersService,
    private sharedspacesService: SharedspacesService,
    private storageR2Service: StorageR2Service,
  ) {}
  
  @Cron('0 30 2 * * *')
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

  @Cron('0 30 3 * * *')
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

  @Cron('0 10 3 * * *')
  async cleanupTodos() {
    const softDeletedTodos = await this.todosRepository.find({
      select: {
        id: true,
      },
      where: {
        removedAt: Not(IsNull()),
      },
    });

    const todoChunks = chunking(softDeletedTodos, 2);

    for (const chunk of todoChunks) {
      const batch = chunk.map(todo => this.todosRepository.delete(todo.id));
      await Promise.all(batch);
    }
  }

  @Cron('0 50 2 * * *')
  async cleanupChats() {
    const softDeletedChats = await this.chatsRepository.find({
      select: {
        id: true,
      },
      where: {
        removedAt: Not(IsNull()),
      },
    });

    const chatChunks = chunking(softDeletedChats, 2);

    for (const chunk of chatChunks) {
      const batch = chunk.map(chat => this.chatsRepository.delete(chat.id));
      await Promise.all(batch);
    }
  }

  @Cron('0 40 2 * * *')
  async cleanupChatImages() {
    const softDeletedImages = await this.imagesRepository.find({
      select: {
        id: true,
        path: true,
      },
      where: {
        status: IMAGE_STATUS.DELETED,
      },
    });

    const imageChunks = chunking(softDeletedImages, 2);

    for (const chunk of imageChunks) {
      const batch = chunk.map(async (image) => {
        await this.storageR2Service.deleteFile(image.path);
        await this.imagesRepository.delete({ id: image.id });
      });

      await Promise.all(batch);
    }
  }

  @Cron('0 40 3 * * 3')
  async cleanupInvites() {
    const ONE_WEEK_AGO = dayjs().subtract(1, 'week').toDate();

    const invites = await this.invitesRepository.find({
      select: {
        id: true,
      },
      where: [
        {
          status: INVITE_STATUS.CANCELED
        },
        {
          expiredAt: LessThan(ONE_WEEK_AGO),
        }
      ],
    });

    const inviteChunks = chunking(invites, 2);

    for (const chunk of inviteChunks) {
      const batch = chunk.map(invite => this.invitesRepository.delete(invite.id));
      await Promise.all(batch);
    }
  }

  @Cron('0 50 3 * * *')
  async cleanupSharedspaceMembers() {
    const softDeletedMembers = await this.sharedspaceMembersRepository.find({
      select: {
        UserId: true,
        SharedspaceId: true,
      },
      where: {
        removedAt: Not(IsNull()),
      },
    });

    const memberChunks = chunking(softDeletedMembers, 2);

    for (const chunk of memberChunks) {
      const batch = chunk.map(member => this.sharedspaceMembersRepository.delete({ UserId: member.UserId, SharedspaceId: member.SharedspaceId }));
      await Promise.all(batch);
    }
  }

  @Cron('0 0 4 * * 3')
  async cleanupExpiredJoinRequests() {
    const ONE_DAY_AGO = dayjs().subtract(1, 'day').toDate();

    const expiredJoinRequests = await this.joinRequestsRepository.find({
      select: {
        id: true,
      },
      where: {
        removedAt: LessThan(ONE_DAY_AGO),
      },
    });

    for (const chunk of chunking(expiredJoinRequests, 2)) {
      const batch = chunk.map(joinRequest => this.joinRequestsRepository.delete(joinRequest.id));
      await Promise.all(batch);
    }
  }
}