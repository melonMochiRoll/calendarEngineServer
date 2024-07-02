import { Test } from '@nestjs/testing';
import { TodosService } from "./todos.service";
import { CacheManagerService } from 'src/cacheManager/cacheManager.service';
import { Todos } from 'src/entities/Todos';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeORMMySqlTestingModule } from 'src/lib/TypeORMMySqlTestingModule';
import { ConfigModule } from '@nestjs/config';
import { Users } from 'src/entities/Users';
import { BadRequestException } from '@nestjs/common';

class mockCacheManagerService {
  getCache() {
    return null;
  }

  setCache() {
    return;
  }
};

describe('TodosService', () => {
  let todosService: TodosService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        TypeORMMySqlTestingModule([Users, Todos]),
        TypeOrmModule.forFeature([Todos]),
      ],
      providers: [
        TodosService,
        {
          provide: CacheManagerService,
          useClass: mockCacheManagerService,
        }
      ],
    }).compile();

    todosService = moduleRef.get<TodosService>(TodosService);
  });

  beforeEach(() => {
    jest.resetModules();
  });

  it('정의', () => {
    expect(todosService).toBeDefined();
  });

  describe('getTodos', () => {
    const expectTodos = [
      {
        id: 167,
        UserId: 10,
        date: '2024-01-20',
        isComplete: false,
        contents: 'search 컴포넌트 추가',
      }
    ];
    const expectDate = '2024-01-20';
    const emtryDate = '2024-01-01';

    it('해당되는 유저와 날짜에 Todos가 존재하면 todos를 반환해야 함', async () => {
      const todos = await todosService.getTodos(expectDate, 10);

      expect(todos).toEqual(expectTodos);
    });

    it('해당되는 유저와 날짜에 Todos가 존재하지 않는다면 빈 배열을 반환해야 함', async () => {
      const todos = await todosService.getTodos(emtryDate, 10);
      const todos2 = await todosService.getTodos(expectDate, 12);
      
      expect(todos).toEqual([]);
      expect(todos2).toEqual([]);
    });

    it('날짜 형식이 YYYY-MM-DD가 아닐경우 BadRequestException를 반환한다.', async () => {
      await expect(async () => {
        await todosService.getTodos('20240618', 10);
      }).rejects.toThrowError(new BadRequestException('날짜 형식을 확인해 주세요.'));
    });
  });

  describe('searchTodos', () => {
    const expectTodos = [
      {
        id: 183,
        contents: 'Todo 검색 기능 정의',
        date: '2024-07-02',
        isComplete: false,
        UserId: 12,
      },
      {
        id: 177,
        contents: 'Todo 검색 기능',
        date: '2024-06-26',
        isComplete: true,
        UserId: 12,
      }
    ];

    it('contents 컬럼에 해당 키워드가 포함된 todos들이 있다면 그 결과가 반환 되어야 한다.', async () => {
      const result = await todosService.searchTodos('Todo', 0, 10, 12);

      expect(result).toEqual(expectTodos);
    });

    it('contents 컬럼에 해당 키워드가 포함된 todos들이 없다면 빈 배열이 반환 되어야 한다.', async () => {
      const result = await todosService.searchTodos('somethingKeyword', 0, 10, 12);

      expect(result).toEqual([]);
    });
  });

  afterAll(() => {
    jest.resetModules();
  });
});