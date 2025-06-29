import { Injectable } from "@nestjs/common";
import bcrypt from 'bcrypt';
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { DataSource, Repository } from "typeorm";
import handleError from "src/common/function/handleError";
import { nanoid } from "nanoid";
import { CacheManagerService } from "src/cacheManager/cacheManager.service";
import { Response } from "express";
import { RefreshTokens } from "src/entities/RefreshTokens";
import dayjs from "dayjs";
import { JwtService } from "@nestjs/jwt";
import { TRefreshTokenPayload } from "src/typings/types";

@Injectable()
export class AuthService {
  constructor(
    private dataSource: DataSource,
    private jwtService: JwtService,
    private cacheManagerService: CacheManagerService,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(RefreshTokens)
    private refreshTokensRepository: Repository<RefreshTokens>,
  ) {}

  async jwtLogin(response: Response, email: string, UserId: number) {
    const qr = this.dataSource.createQueryRunner();

    const accessTokenExpires = dayjs().add(15, 'minute');
    const refreshTokenExpires = dayjs().add(7, 'day');
    const jti = nanoid(20);

    const accessToken = this.jwtService.sign({
      email,
      UserId,
      exp: accessTokenExpires.unix(),
    });

    const refreshToken = this.jwtService.sign({
      jti,
      email,
      UserId,
      exp: refreshTokenExpires.unix(),
    });

    await qr.connect();
    await qr.startTransaction();

    try {
      await qr.manager.delete(RefreshTokens, { UserId });

      await qr.manager.save(RefreshTokens, {
        jti,
        token: refreshToken,
        UserId,
        expiresAt: refreshTokenExpires.toDate(),
      });

      response.cookie('accessToken', accessToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        expires: accessTokenExpires.toDate(),
      });
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        expires: refreshTokenExpires.toDate(),
      });

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      handleError(err);
    } finally {
      await qr.release();
    }
  }

  async getGoogleAuthorizationUrl() {
    const scope = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');

    const state = nanoid(Number(process.env.SALT_OR_ROUNDS));
    await this.cacheManagerService.setGuestCache(state, true);

    const request_url = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      response_type: 'code',
      state,
      redirect_uri: `${process.env.SERVER_ORIGIN}/api/auth/login/oauth2/google/callback`,
      scope,
      prompt: 'select_account',
    }).toString();

    return `${request_url}?${params}`;
  }

  async getNaverAuthorizationUrl() {
    const state = nanoid(Number(process.env.SALT_OR_ROUNDS));

    await this.cacheManagerService.setGuestCache(state, true);

    const request_url = 'https://nid.naver.com/oauth2.0/authorize';
    const params = new URLSearchParams({
      client_id: process.env.NAVER_CLIENT_ID,
      response_type: 'code',
      state,
      redirect_uri: `${process.env.SERVER_ORIGIN}/api/auth/login/oauth2/naver/callback`,
    }).toString();

    return `${request_url}?${params}`;
  }

  async validateUser(
    email: string,
    password: string,
  ) {
    try {
      const user = await this.usersRepository.findOne({
        select: {
          id: true,
          email: true,
          password: true,
          profileImage: true,
          Sharedspacemembers: {
            SharedspaceId: true,
            Sharedspace: {
              url: true,
              private: true,
            },
            Role: {
              name: true,
            },
          },
        },
        relations: {
          Sharedspacemembers: {
            Sharedspace: true,
            Role: true,
          },
        },
        where: {
          email,
        },
      });

      const compare = await bcrypt.compare(password, user?.password || '');
  
      if (!user || !compare) {
        return null;
      }
  
      const { password: _, ...rest } = user;
      return rest;
    } catch (err) {
      handleError(err);
    }
  }

  async logout(response: Response, user: Users) {
    try {
      await this.refreshTokensRepository.delete({ UserId: user.id })
        .then(() => {
          response.clearCookie('accessToken', {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
          });
          response.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
          });
        });
    } catch (err) {
      handleError(err);
    }
  }
}