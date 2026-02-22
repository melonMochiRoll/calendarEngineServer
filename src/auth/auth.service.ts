import { Injectable } from "@nestjs/common";
import bcrypt from 'bcrypt';
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { DataSource, Repository } from "typeorm";
import { nanoid } from "nanoid";
import { Response } from "express";
import { RefreshTokens } from "src/entities/RefreshTokens";
import dayjs from "dayjs";
import { JwtService } from "@nestjs/jwt";
import { ACCESS_TOKEN_COOKIE_NAME, CSRF_TOKEN_COOKIE_NAME, OAUTH2_CSRF_STATE_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "src/common/constant/auth.constants";

@Injectable()
export class AuthService {
  constructor(
    private dataSource: DataSource,
    private jwtService: JwtService,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(RefreshTokens)
    private refreshTokensRepository: Repository<RefreshTokens>,
  ) {}

  async jwtLogin(response: Response, UserId: number) {
    const qr = this.dataSource.createQueryRunner();

    const accessTokenExpires = dayjs().add(15, 'minute');
    const refreshTokenExpires = dayjs().add(7, 'day');
    const jti = nanoid(+process.env.REFRESH_TOKEN_JTI_SIZE);

    const accessToken = this.jwtService.sign({
      UserId,
      exp: accessTokenExpires.unix(),
    });

    const refreshToken = this.jwtService.sign({
      jti,
      UserId,
      exp: refreshTokenExpires.unix(),
    });

    const cookieOption = {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    } as const;

    await qr.connect();
    await qr.startTransaction();

    try {
      await qr.manager.delete(RefreshTokens, { UserId });

      await qr.manager.save(RefreshTokens, {
        jti,
        UserId,
        expiresAt: refreshTokenExpires.toDate(),
      });

      response.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
        ...cookieOption,
        expires: accessTokenExpires.toDate(),
      });
      response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        ...cookieOption,
        expires: refreshTokenExpires.toDate(),
      });

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();

      response.clearCookie(ACCESS_TOKEN_COOKIE_NAME, { ...cookieOption });
      response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { ...cookieOption });

      throw err;
    } finally {
      await qr.release();
    }
  }

  async getGoogleAuthorizationUrl(response: Response) {
    const scope = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');

    const state = nanoid(+process.env.SALT_OR_ROUNDS);

    const request_url = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      response_type: 'code',
      state,
      redirect_uri: `${process.env.SERVER_ORIGIN}/api/auth/login/oauth2/google/callback`,
      scope,
      prompt: 'select_account',
    }).toString();

    response
      .cookie(OAUTH2_CSRF_STATE_COOKIE_NAME, state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
      .json(`${request_url}?${params}`);
  }

  async getNaverAuthorizationUrl(response: Response) {
    const state = nanoid(+process.env.SALT_OR_ROUNDS);

    const request_url = 'https://nid.naver.com/oauth2.0/authorize';
    const params = new URLSearchParams({
      client_id: process.env.NAVER_CLIENT_ID,
      response_type: 'code',
      state,
      redirect_uri: `${process.env.SERVER_ORIGIN}/api/auth/login/oauth2/naver/callback`,
    }).toString();

    response
      .cookie(OAUTH2_CSRF_STATE_COOKIE_NAME, state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
      .json(`${request_url}?${params}`);
  }

  async validateUser(
    email: string,
    password: string,
  ) {
    const user = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        password: true,
        profileImage: true,
      },
      where: {
        email,
      },
    });

    const compare = await bcrypt.compare(password, user?.password || '');

    if (!user || !compare) {
      return false;
    }

    const { password: _, ...withoutPassword } = user;
    return withoutPassword;
  }

  async logout(response: Response, user: Users) {
    await this.refreshTokensRepository.delete({ UserId: user.id });
    
    const cookieOption = {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    } as const;

    response.clearCookie(ACCESS_TOKEN_COOKIE_NAME, { ...cookieOption });
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { ...cookieOption });
    response.clearCookie(CSRF_TOKEN_COOKIE_NAME, { ...cookieOption });
  }

  getCsrfToken(response: Response) {
    const csrfToken = nanoid(+process.env.CSRF_TOKEN_SIZE);

    response
      .cookie(CSRF_TOKEN_COOKIE_NAME, csrfToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      })
      .json({ csrfToken });
  }
}