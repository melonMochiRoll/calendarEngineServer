import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Like, Repository } from "typeorm";
import { Todos } from "src/entities/Todos";
import dayjs from "dayjs";
import { CreateTodoDTO } from "./dto/create.todo.dto";

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todos)
    private todosRepository: Repository<Todos>,
  ) {}

  async getTodos(
    date: string,
    AuthorId: number,
  ): Promise<any> {
    // const datePattern = /^\w{4}-\w{2}-\w{2}$/;

    // if (!datePattern.test(date)) {
    //   throw new BadRequestException('날짜 형식을 확인해 주세요.');
    // }

    // const currentDate = dayjs(`${date}`);
    // const currentYear = currentDate.year();
    // const currentMonth = currentDate.month() + 1;
    // const currentDay = currentDate.date();
    // try {
    //   const searchResult = await this.todosRepository.find({
    //     where: {
    //       AuthorId,
    //       date: dayjs(date).toDate(),
    //     },
    //   });

    //   return searchResult;
    // } catch (err: any) {
    //   throw new InternalServerErrorException(err);
    // }
  };

  async getCurrentMonthTodosList(
    date: string,
    AuthorId: number,
  ): Promise<any> {
    // try {
    //   const currentDate = dayjs(`${date}`);
    //   const currentYear = currentDate.year();
    //   const currentMonth = currentDate.month() + 1;

    //   const searchResult =
    //     await this.todosRepository
    //       .find({
    //         select: {
    //           description: true,
    //           date: true,
    //         },
    //         where: {
    //           AuthorId,
    //           date: Between(
    //             dayjs(`${currentYear}-${currentMonth}-1`).toDate(),
    //             dayjs(`${currentYear}-${currentMonth}-31`).toDate()
    //           )
    //         },
    //         order: {
    //           id: 'ASC',
    //         }
    //       });

    //   const todosList =
    //     searchResult
    //       .reduce((acc: any, item: { description: string, date: Date }) => {
    //         if (acc[`${item.date}`]) {
    //           if (acc[`${item.date}`].partialContents.length < 3) {
    //             acc[`${item.date}`].partialContents.push(item.description);
    //             return acc;
    //           }

    //           return acc;
    //         }
  
    //         acc[`${item.date}`] = {
    //           partialContents: [ item.description ],
    //         };
    //         return acc;
    //       }, {});
      
    //   return todosList;
    // } catch (err: any) {
    //   throw new InternalServerErrorException(err);
    // }
  };

  async createTodo(dto: CreateTodoDTO) {
    try {
      await this.todosRepository.save({ ...dto });

      return true;
    } catch (err: any) {
      console.error(`createTodo : ${err}`);
      throw new InternalServerErrorException(err);
    }
  };

  async updateDateTodos(
    todosId: number,
    description: string,
    date: string,
    AuthorId: number,
  ) {
    // const currentDate = dayjs(`${date}`);
    // const currentYear = currentDate.year();
    // const currentMonth = currentDate.month() + 1;
    // const currentDay = currentDate.date();

    // try {
    //   await this.todosRepository
    //     .update({ id: todosId }, { description });

    //   return true;
    // } catch (err: any) {
    //   throw new InternalServerErrorException(err);
    // }
  };

  async deleteDateTodos(
    todosId: number,
    date: string,
    AuthorId: number,
  ) {
    // try {
    //   const currentDate = dayjs(`${date}`);
    //   const currentYear = currentDate.year();
    //   const currentMonth = currentDate.month() + 1;
    //   const currentDay = currentDate.date();

    //   await this.todosRepository
    //     .delete(todosId);

    //   return true;
    // } catch (err: any) {
    //   throw new InternalServerErrorException(err);
    // }
  };

  async searchTodos(
    query: string,
    offset: number,
    limit: number,
    AuthorId: number,
  ) {
    // try {
    //   offset = (offset - 1) * limit;

    //   const searchResult =
    //     await this.todosRepository.find({
    //       where: {
    //         AuthorId,
    //         description: Like(`%${query}%`),
    //       },
    //       order: {
    //         date: 'DESC',
    //       },
    //       skip: offset,
    //       take: limit,
    //     });

    //   return searchResult;
    // } catch (err) {
    //   throw new InternalServerErrorException(err);
    // }
  };
}

// TODO : 테이블 구조 변경에 따른 로직 수정 필요
// TODO : 로직 수정에 따른 캐싱 전략 수정 필요