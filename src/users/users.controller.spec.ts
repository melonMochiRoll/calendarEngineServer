import { Test } from '@nestjs/testing';
import { UsersController } from "./users.controller";
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request } from 'express';
import { Users } from 'src/entities/Users';
import { Repository } from 'typeorm';

class mockRepository {};

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;
  let repo: Repository<Users>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Users),
          useClass: mockRepository,
        }
      ],
    }).compile();

    usersController = moduleRef.get<UsersController>(UsersController);
    usersService = moduleRef.get<UsersService>(UsersService);
    repo = moduleRef.get<Repository<Users>>(getRepositoryToken(Users));
  });

  it('정의', () => {
    expect(usersController).toBeDefined();
  });

  describe('getUser', () => {
    const expectUser = {
      id: 12,
      email: 'Yujin@naver.com',
      createdAt: new Date('2024-06-17'),
      deletedAt: null,
    };

    it('세션에 user가 있다면 user를 반환해야 함', () => {
      const mockRequest = {
        user: {
          id: 12,
          email: 'Yujin@naver.com',
          createdAt: new Date('2024-06-17'),
          deletedAt: null,
        },
      } as unknown as Request;

      const user = usersController.getUser(mockRequest.user as Users);

      expect(user).toStrictEqual(expectUser);
    });

    it('세션에 user가 없다면 false를 반환해야 함', () => {
      const mockRequest = {
        user: null,
      } as unknown as Request;

      const user = usersController.getUser(mockRequest.user as Users);

      expect(user).toStrictEqual(false);
    })
  });
});