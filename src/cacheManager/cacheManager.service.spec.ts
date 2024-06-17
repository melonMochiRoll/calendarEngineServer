import { Test } from '@nestjs/testing';
import { CacheModule } from "@nestjs/cache-manager";
import { CacheManagerService } from "./cacheManager.service";
import { UserWithoutPassword } from 'src/typings/types';

describe('CacheManagerService', () => {
  let cacheManagerService: CacheManagerService;
  const userId = 12345;
  const USERDATA = 'userData';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [CacheManagerService],
    }).compile();

    cacheManagerService = moduleRef.get<CacheManagerService>(CacheManagerService);
  });

  it('정의', () => {
    expect(cacheManagerService).toBeDefined();
  });

  describe('getCache', () => {
    const userData1: UserWithoutPassword = {
      id: userId,
      email: 'Yujin@naver.com',
      createdAt: new Date('2023-11-14'),
      deletedAt: null,
    };

    beforeEach(async () => {
      await cacheManagerService.setCache(userId, USERDATA, userData1);
    });

    it('key값에 해당하는 value가 있을때', async () => {
      const cached = await cacheManagerService.getCache(userId, USERDATA);

      expect(cached).toEqual(userData1);
    });

    it('key값에 해당하는 value가 없을때', async () => {
      const wrongId = 54431;
      const cached = await cacheManagerService.getCache(wrongId, USERDATA);

      expect(cached).toEqual(null);
    });

    afterEach(async () => {
      await cacheManagerService.delCache(userId, USERDATA);
    });
  });

  afterAll(async () => {
    await cacheManagerService.resetCache();
  });
});