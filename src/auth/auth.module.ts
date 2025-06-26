import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategy/local.strategy';
import { SessionSerializer } from './session.serializer';
import { CacheManagerModule } from 'src/cacheManager/cacheManager.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/entities/Users';
import { NaverStrategy } from './strategy/naver.strategy';
import { GoogleStrategy } from './strategy/google.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtLocalStrategy } from './strategy/jwt.local.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { RefreshTokens } from 'src/entities/RefreshTokens';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    TypeOrmModule.forFeature([
      Users,
      RefreshTokens,
    ]),
    UsersModule,
    CacheManagerModule,
  ],
  controllers: [ AuthController ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtLocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    NaverStrategy,
    SessionSerializer,
  ],
})

export class AuthModule {}