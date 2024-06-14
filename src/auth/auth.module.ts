import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './local.strategy';
import { SessionSerializer } from './session.serializer';
import { CacheManagerModule } from 'src/cacheManager/cacheManager.module';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    UsersModule,
    CacheManagerModule,
  ],
  controllers: [ AuthController ],
  providers: [
    AuthService,
    LocalStrategy,
    SessionSerializer,
  ],
})

export class AuthModule {}