import { Test } from '@nestjs/testing';
import { AuthService } from "./auth.service";
import { UsersService } from 'src/users/users.service';
import bcrypt from 'bcrypt';

class mockUsersService {
  getOneByEmail() {
    return {
      id: 12,
      email: 'Yujin@naver.com',
      password: 'encryptedPassword',
      createdAt: new Date('2024-06-17'),
      deletedAt: null,
    };
  }
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useClass: mockUsersService,
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  it('정의', () => {
    expect(authService).toBeDefined();
  });

  describe('validateUser', () => {
    const loginForm = {
      email: 'Yujin@naver.com',
      password: 'password',
    };
    const expertUser = {
      id: 12,
      email: 'Yujin@naver.com',
      createdAt: new Date('2024-06-17'),
      deletedAt: null,
    };

    it('해당되는 유저가 있고 비밀번호가 일치하면 password를 뺀 user 객체를 반환해야함', async () => {
      const spyBcrypt = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      const user = await authService.validateUser(loginForm.email, loginForm.password);

      expect(spyBcrypt).toHaveBeenCalled();
      expect(user).toStrictEqual(expertUser);
    });

    it('해당되는 유저가 없거나 비밀번호가 틀리면 null을 반환해야함', async () => {
      const spyBcrypt = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));
      const user = await authService.validateUser('wrongEmail', 'wrongPassword');

      expect(spyBcrypt).toHaveBeenCalled();
      expect(user).toStrictEqual(null);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });
});